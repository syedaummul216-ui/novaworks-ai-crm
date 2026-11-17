import { findSafeUserById, getPublicTeamDirectory } from '../data/team';
import type {
  AgentTaskItem,
  EnrichedProject,
  EnrichedProjectTask,
  Project,
  SafeUser,
  TaskUpdateInput,
} from '../types/crm';
import { loadStoredProjects, saveStoredProjects } from './storageService';
import { isValidIsoDate2026 } from './transcriptService';

const SKILL_SYNONYMS: Record<string, string[]> = {
  react: ['react', 'tsx', 'jsx', 'component', 'ui', 'catalog', 'storefront'],
  'frontend integration': ['frontend', 'integration', 'responsive', 'form', 'client', 'view'],
  'node.js': ['node', 'node.js', 'express', 'backend', 'server', 'endpoint'],
  databases: ['database', 'databases', 'postgres', 'postgresql', 'sql', 'schema', 'table'],
  apis: ['api', 'apis', 'rest', 'endpoint', 'webhook'],
  flutter: ['flutter', 'dart', 'mobile', 'ios', 'android'],
  'mobile ui': ['mobile ui', 'screen', 'screens', 'checklist', 'widget', 'app'],
  integration: ['integration', 'wire', 'staging', 'client'],
  testing: ['test', 'testing', 'regression', 'qa', 'suite', 'coverage'],
  llms: ['llm', 'llms', 'model', 'gpt', 'gemini', 'copilot', 'ai'],
  extraction: ['extract', 'extraction', 'parse', 'parsing', 'clause', 'json'],
  prompts: ['prompt', 'prompts', 'triage', 'instruction'],
  retrieval: ['retrieval', 'rag', 'search', 'semantic', 'index', 'indexing', 'citation'],
  'document processing': ['document', 'documents', 'pdf', 'chunk', 'chunking', 'ingestion', 'handbook'],
};

export function matchDeveloperSkill(
  taskTitle: string,
  taskDescription: string,
  developerSkills: string[]
): string {
  if (developerSkills.length === 0) {
    return 'Delivery';
  }

  const haystack = `${taskTitle} ${taskDescription}`.toLowerCase();
  let bestSkill = developerSkills[0];
  let bestScore = 0;

  for (const skill of developerSkills) {
    const normalized = skill.toLowerCase();
    let score = 0;

    if (haystack.includes(normalized)) {
      score += 3;
    }

    const keywords = SKILL_SYNONYMS[normalized] ?? normalized.split(/[\s,/]+/).filter(Boolean);
    for (const kw of keywords) {
      if (kw.length >= 2 && haystack.includes(kw)) {
        score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestSkill = skill;
    }
  }

  return bestSkill;
}

function enrichProject(project: Project): EnrichedProject {
  const manager = findSafeUserById(project.managerId);

  const enrichedTasks: EnrichedProjectTask[] = project.tasks.map((task) => {
    const dev = findSafeUserById(task.assigneeId);
    const matchedSkill = matchDeveloperSkill(
      task.title,
      task.description,
      dev?.skills ?? []
    );

    return {
      ...task,
      assigneeName: dev ? dev.name : task.assigneeId,
      assigneeSpecialization: dev ? dev.specialization : 'Developer',
      matchedSkill,
    };
  });

  const totalEstimatedHours = enrichedTasks.reduce(
    (sum, task) => sum + Number(task.estimatedHours || 0),
    0
  );

  return {
    ...project,
    managerName: manager ? manager.name : project.managerId,
    managerSpecialization: manager ? manager.specialization : 'Project Manager',
    totalEstimatedHours,
    tasks: enrichedTasks,
  };
}

/**
 * Strictly enforces role-based project visibility in the data/service layer:
 * - ADMIN: all projects
 * - MANAGER: only projects where project.managerId === user.id
 * - AGENT: empty array (agents only access their own tasks via getTasksForUser)
 */
export function getProjectsForUser(user: SafeUser): EnrichedProject[] {
  const projects = loadStoredProjects();

  if (user.role === 'ADMIN') {
    return projects.map(enrichProject);
  }

  if (user.role === 'MANAGER') {
    return projects
      .filter((project) => project.managerId === user.id)
      .map(enrichProject);
  }

  return [];
}

/**
 * Strictly enforces project detail access in the data/service layer:
 * - ADMIN: any project
 * - MANAGER: only if project.managerId === user.id
 * - AGENT: null (forbidden)
 */
export function getProjectByIdForUser(
  user: SafeUser,
  projectId: string
): EnrichedProject | null {
  if (user.role === 'AGENT') {
    return null;
  }

  const projects = loadStoredProjects();
  const found = projects.find((project) => project.id === projectId);
  if (!found) {
    return null;
  }

  if (user.role === 'MANAGER' && found.managerId !== user.id) {
    return null;
  }

  return enrichProject(found);
}

/**
 * Strictly enforces task-level visibility in the data/service layer:
 * - AGENT: ONLY tasks where task.assigneeId === user.id (never other developers' tasks)
 * - MANAGER: ONLY tasks inside projects assigned to that manager
 * - ADMIN: all tasks
 */
export function getTasksForUser(user: SafeUser): AgentTaskItem[] {
  const projects = loadStoredProjects();
  const result: AgentTaskItem[] = [];

  for (const project of projects) {
    if (user.role === 'MANAGER' && project.managerId !== user.id) {
      continue;
    }

    const manager = findSafeUserById(project.managerId);
    const managerName = manager ? manager.name : project.managerId;

    for (const task of project.tasks) {
      if (user.role === 'AGENT' && task.assigneeId !== user.id) {
        continue;
      }

      const assignee = findSafeUserById(task.assigneeId);
      const matchedSkill = matchDeveloperSkill(
        task.title,
        task.description,
        assignee?.skills ?? []
      );

      result.push({
        ...task,
        projectId: project.id,
        projectName: project.name,
        clientName: project.clientName,
        projectDeadline: project.deadline,
        managerId: project.managerId,
        managerName,
        assigneeName: assignee ? assignee.name : task.assigneeId,
        matchedSkill,
      });
    }
  }

  return result.sort((a, b) => a.deadline.localeCompare(b.deadline));
}

export function saveValidatedProjects(
  user: SafeUser,
  newProjects: Project[]
): EnrichedProject[] {
  if (user.role !== 'ADMIN') {
    throw new Error('Only Admin accounts are authorized to create projects from transcripts.');
  }

  const existing = loadStoredProjects();
  const updated = [...newProjects, ...existing];
  saveStoredProjects(updated);
  return updated.map(enrichProject);
}

export function updateProjectTaskForUser(params: {
  user: SafeUser;
  projectId: string;
  taskId: string;
  input: TaskUpdateInput;
}): { project: EnrichedProject | null; errors: string[] } {
  const { user, projectId, taskId, input } = params;

  if (user.role === 'AGENT') {
    return {
      project: null,
      errors: ['Unauthorized: Developers cannot edit project tasks.'],
    };
  }

  const projects = loadStoredProjects();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) {
    return {
      project: null,
      errors: ['Project not found.'],
    };
  }

  const project = projects[projectIndex];
  if (user.role === 'MANAGER' && project.managerId !== user.id) {
    return {
      project: null,
      errors: ['Unauthorized: Only Admin or the assigned Project Manager can edit tasks in this project.'],
    };
  }

  const taskIndex = project.tasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) {
    return {
      project: null,
      errors: ['Task not found in this project.'],
    };
  }

  const errors: string[] = [];
  const title = input.title.trim();
  const description = input.description.trim();
  const assigneeId = input.assigneeId.trim();
  const deadline = input.deadline.trim();
  const estimatedHours = Number(input.estimatedHours);

  const assignee = findSafeUserById(assigneeId);

  if (!title) {
    errors.push('Task title is required.');
  }
  if (!description) {
    errors.push('Scope description is required.');
  }
  if (!assignee || assignee.role !== 'AGENT') {
    errors.push(`Invalid assignee "${assigneeId || 'empty'}" (must be a valid AGENT).`);
  }
  if (!Number.isFinite(estimatedHours) || estimatedHours <= 0) {
    errors.push('Estimated hours must be greater than 0.');
  }
  if (!isValidIsoDate2026(deadline)) {
    errors.push('Task deadline must be a valid YYYY-MM-DD date in 2026.');
  } else if (deadline > project.deadline) {
    errors.push(
      `Task deadline (${deadline}) cannot exceed project deadline (${project.deadline}).`
    );
  }

  if (errors.length > 0) {
    return { project: null, errors };
  }

  const updatedProject: Project = {
    ...project,
    tasks: project.tasks.map((t, idx) =>
      idx === taskIndex
        ? {
            ...t,
            title,
            description,
            assigneeId,
            deadline,
            estimatedHours,
          }
        : t
    ),
  };

  const nextProjects = [...projects];
  nextProjects[projectIndex] = updatedProject;
  saveStoredProjects(nextProjects);

  return {
    project: enrichProject(updatedProject),
    errors: [],
  };
}

export function deleteProjectForUser(user: SafeUser, projectId: string): EnrichedProject[] {
  if (user.role !== 'ADMIN') {
    throw new Error('Only Admin accounts are authorized to delete projects.');
  }

  const existing = loadStoredProjects();
  const updated = existing.filter((project) => project.id !== projectId);
  saveStoredProjects(updated);
  return updated.map(enrichProject);
}

export function getTeamDirectory(): SafeUser[] {
  return getPublicTeamDirectory();
}

export function getAssignableAgents(): SafeUser[] {
  return getPublicTeamDirectory().filter((member) => member.role === 'AGENT');
}
