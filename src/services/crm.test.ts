import test from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage for Node test environment
const store = new Map<string, string>();
(globalThis as unknown as { window: { localStorage: Storage } }).window = {
  localStorage: {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  },
};

import { loginWithCredentials, quickDemoLogin } from './authService.ts';
import {
  getProjectByIdForUser,
  getProjectsForUser,
  getTasksForUser,
  getTeamDirectory,
  matchDeveloperSkill,
  saveValidatedProjects,
  updateProjectTaskForUser,
} from './crmService.ts';
import { loadStoredAuditSummary, saveStoredAuditSummary } from './storageService.ts';
import { extractJsonPayload, validateExtractedPayload } from './transcriptService.ts';

test('Team directory returns all 10 employees without password fields', () => {
  const team = getTeamDirectory();
  assert.equal(team.length, 10);
  for (const member of team) {
    assert.equal('passwordHash' in member, false);
    assert.equal('password' in member, false);
  }
});

test('DEV01 logs in with both ali@novaworks.e and ali@novaworks.example', () => {
  const res1 = loginWithCredentials('ali@novaworks.e', 'Demo123!');
  assert.equal(res1.user?.id, 'DEV01');
  assert.equal(res1.error, null);

  const res2 = loginWithCredentials('ali@novaworks.example', 'Demo123!');
  assert.equal(res2.user?.id, 'DEV01');
  assert.equal(res2.error, null);

  const bad = loginWithCredentials('ali@novaworks.e', 'wrong');
  assert.equal(bad.user, null);
  assert.ok(bad.error);
});

test('Projects are empty on fresh startup and strict role-based filtering applies once created', () => {
  const admin = quickDemoLogin('ADMIN')!;
  const pm01 = quickDemoLogin('PM01')!;
  const dev01 = quickDemoLogin('DEV01')!;

  // Startup state has 0 pre-seeded projects
  assert.equal(getProjectsForUser(admin).length, 0);
  assert.equal(getProjectsForUser(pm01).length, 0);
  assert.equal(getTasksForUser(dev01).length, 0);

  // Admin creates two projects via transcript save
  saveValidatedProjects(admin, [
    {
      id: 'proj-web-1',
      name: 'Web Portal',
      clientName: 'Client Web',
      description: 'Portal scope',
      managerId: 'PM01',
      deadline: '2026-12-10',
      createdAt: '2026-11-16T00:00:00.000Z',
      tasks: [
        {
          id: 'task-1',
          title: 'React UI',
          description: 'Frontend views',
          assigneeId: 'DEV01',
          deadline: '2026-12-05',
          estimatedHours: 16,
        },
        {
          id: 'task-2',
          title: 'Node API',
          description: 'Backend API',
          assigneeId: 'DEV02',
          deadline: '2026-12-08',
          estimatedHours: 20,
        },
      ],
    },
    {
      id: 'proj-mob-1',
      name: 'Mobile App',
      clientName: 'Client Mobile',
      description: 'Mobile scope',
      managerId: 'PM02',
      deadline: '2026-12-15',
      createdAt: '2026-11-16T00:00:00.000Z',
      tasks: [
        {
          id: 'task-3',
          title: 'Flutter UI',
          description: 'Mobile screens',
          assigneeId: 'DEV03',
          deadline: '2026-12-10',
          estimatedHours: 18,
        },
      ],
    },
  ]);

  const adminProjects = getProjectsForUser(admin);
  assert.equal(adminProjects.length, 2);

  const pm01Projects = getProjectsForUser(pm01);
  assert.equal(pm01Projects.length, 1);
  assert.equal(pm01Projects[0].managerId, 'PM01');

  // PM01 cannot view PM02's project
  assert.equal(getProjectByIdForUser(pm01, 'proj-mob-1'), null);
  assert.ok(getProjectByIdForUser(pm01, 'proj-web-1'));

  // Agent sees 0 project cards and cannot view project detail
  assert.equal(getProjectsForUser(dev01).length, 0);
  assert.equal(getProjectByIdForUser(dev01, 'proj-web-1'), null);

  // Agent sees ONLY tasks assigned to DEV01
  const dev01Tasks = getTasksForUser(dev01);
  assert.equal(dev01Tasks.length, 1);
  assert.equal(dev01Tasks[0].assigneeId, 'DEV01');
});

test('validateExtractedPayload rejects invalid manager, invalid assignee, <=0 hours, and deadline > project.deadline atomically', () => {
  const invalidPayload = {
    projects: [
      {
        name: 'Valid Project',
        clientName: 'Client A',
        description: 'Valid scope',
        managerId: 'DEV01', // invalid: AGENT instead of MANAGER
        deadline: '2026-10-20',
        tasks: [
          {
            title: 'Task 1',
            description: 'Scope',
            assigneeId: 'PM01', // invalid: MANAGER instead of AGENT
            deadline: '2026-10-25', // invalid: > project deadline
            estimatedHours: 0, // invalid: <= 0
          },
        ],
      },
    ],
  };

  const result = validateExtractedPayload(invalidPayload);
  assert.equal(result.projects.length, 0);
  assert.ok(result.errors.length >= 4);
});

test('validateExtractedPayload accepts valid 2026 payload', () => {
  const validPayload = {
    projects: [
      {
        name: 'Vertex Retail Hub',
        clientName: 'Vertex Retail Corp',
        description: 'Storefront catalog portal and vendor API.',
        managerId: 'PM01',
        deadline: '2026-12-12',
        tasks: [
          {
            title: 'Catalog UI',
            description: 'React storefront catalog views',
            assigneeId: 'DEV01',
            deadline: '2026-12-06',
            estimatedHours: 20,
          },
        ],
      },
    ],
  };

  const result = validateExtractedPayload(validPayload);
  assert.equal(result.errors.length, 0);
  assert.equal(result.projects.length, 1);
  assert.equal(result.projects[0].tasks[0].estimatedHours, 20);
});

test('extractJsonPayload strips markdown fences and surrounding prose cleanly', () => {
  const messyOutput = `Here is the extracted scope:
\`\`\`json
{"projects": [{"name": "Test", "clientName": "Acme", "description": "Desc", "managerId": "PM01", "deadline": "2026-11-10", "tasks": []}]}
\`\`\`
Let me know if anything else is needed.`;
  const parsed = extractJsonPayload(messyOutput) as { projects: Array<{ name: string }> };
  assert.equal(parsed.projects[0].name, 'Test');
});

test('validateExtractedPayload parses auditSummary and persists in localStorage', () => {
  const payload = {
    projects: [
      {
        name: 'Vertex Retail Hub',
        clientName: 'Vertex Retail Corp',
        description: 'Catalog portal',
        managerId: 'PM01',
        deadline: '2026-12-12',
        tasks: [
          {
            title: 'React Catalog UI',
            description: 'Build storefront product catalog in React',
            assigneeId: 'DEV01',
            deadline: '2026-12-06',
            estimatedHours: 20,
          },
        ],
      },
    ],
    auditSummary: {
      revisionsApplied: ['Ali Raza hours updated from 16 to 20'],
      excludedFeatures: ['Online payment checkout', 'Live tracking maps'],
      ignoredExternalPeople: ['Kamran (external agency)'],
    },
  };

  const result = validateExtractedPayload(payload);
  assert.equal(result.errors.length, 0);
  assert.ok(result.auditSummary);
  assert.deepEqual(result.auditSummary.revisionsApplied, [
    'Ali Raza hours updated from 16 to 20',
  ]);
  assert.deepEqual(result.auditSummary.ignoredExternalPeople, ['Kamran (external agency)']);

  saveStoredAuditSummary(result.auditSummary);
  const loaded = loadStoredAuditSummary();
  assert.ok(loaded);
  assert.equal(loaded.excludedFeatures.length, 2);
});

test('matchDeveloperSkill and inline task editing enforce RBAC and validation rules', () => {
  assert.equal(
    matchDeveloperSkill('Flutter UI', 'Build mobile checklist screens', ['Flutter', 'Mobile UI']),
    'Flutter'
  );
  assert.equal(
    matchDeveloperSkill('React Catalog UI', 'Build React product catalog components', [
      'React',
      'Frontend integration',
    ]),
    'React'
  );
  assert.equal(
    matchDeveloperSkill('Frontend Integration', 'Wire responsive client views', [
      'React',
      'Frontend integration',
    ]),
    'Frontend integration'
  );

  const admin = quickDemoLogin('ADMIN')!;
  const pm01 = quickDemoLogin('PM01')!;
  const pm02 = quickDemoLogin('PM02')!;
  const dev01 = quickDemoLogin('DEV01')!;

  // AGENT cannot edit tasks
  const agentEdit = updateProjectTaskForUser({
    user: dev01,
    projectId: 'proj-web-1',
    taskId: 'task-1',
    input: {
      title: 'Hacked',
      description: 'Scope',
      assigneeId: 'DEV01',
      deadline: '2026-12-05',
      estimatedHours: 10,
    },
  });
  assert.equal(agentEdit.project, null);
  assert.ok(agentEdit.errors.length > 0);

  // Unassigned manager PM02 cannot edit PM01's project task
  const wrongManagerEdit = updateProjectTaskForUser({
    user: pm02,
    projectId: 'proj-web-1',
    taskId: 'task-1',
    input: {
      title: 'Updated',
      description: 'Scope',
      assigneeId: 'DEV01',
      deadline: '2026-12-05',
      estimatedHours: 10,
    },
  });
  assert.equal(wrongManagerEdit.project, null);
  assert.ok(wrongManagerEdit.errors.length > 0);

  // Validation rejects deadline > project.deadline and hours <= 0
  const invalidEdit = updateProjectTaskForUser({
    user: pm01,
    projectId: 'proj-web-1',
    taskId: 'task-1',
    input: {
      title: 'React UI',
      description: 'Updated scope',
      assigneeId: 'DEV01',
      deadline: '2026-12-25', // > 2026-12-10
      estimatedHours: 0,
    },
  });
  assert.equal(invalidEdit.project, null);
  assert.equal(invalidEdit.errors.length, 2);

  // Assigned manager PM01 can edit valid fields
  const validEdit = updateProjectTaskForUser({
    user: pm01,
    projectId: 'proj-web-1',
    taskId: 'task-1',
    input: {
      title: 'React Storefront UI',
      description: 'Updated React scope',
      assigneeId: 'DEV01',
      deadline: '2026-12-06',
      estimatedHours: 24,
    },
  });
  assert.equal(validEdit.errors.length, 0);
  assert.ok(validEdit.project);
  assert.equal(validEdit.project.tasks[0].title, 'React Storefront UI');
  assert.equal(validEdit.project.tasks[0].estimatedHours, 24);
  assert.equal(validEdit.project.tasks[0].matchedSkill, 'React');

  // Admin can also edit
  const adminEdit = updateProjectTaskForUser({
    user: admin,
    projectId: 'proj-web-1',
    taskId: 'task-1',
    input: {
      title: 'React Storefront UI v2',
      description: 'Admin verified React scope',
      assigneeId: 'DEV01',
      deadline: '2026-12-07',
      estimatedHours: 26,
    },
  });
  assert.equal(adminEdit.errors.length, 0);
  assert.equal(adminEdit.project?.tasks[0].estimatedHours, 26);
});
