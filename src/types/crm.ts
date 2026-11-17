export type Role = 'ADMIN' | 'MANAGER' | 'AGENT';

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  alternateEmails?: string[];
  role: Role;
  specialization: string;
  skills: string[];
}

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  deadline: string; // YYYY-MM-DD
  estimatedHours: number;
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
  description: string;
  managerId: string;
  deadline: string; // YYYY-MM-DD
  createdAt: string;
  tasks: ProjectTask[];
}

export interface EnrichedProjectTask extends ProjectTask {
  assigneeName: string;
  assigneeSpecialization: string;
  matchedSkill: string;
}

export interface EnrichedProject extends Omit<Project, 'tasks'> {
  managerName: string;
  managerSpecialization: string;
  totalEstimatedHours: number;
  tasks: EnrichedProjectTask[];
}

export interface AgentTaskItem extends ProjectTask {
  projectId: string;
  projectName: string;
  clientName: string;
  projectDeadline: string;
  managerId: string;
  managerName: string;
  assigneeName: string;
  matchedSkill: string;
}

export interface AuditSummary {
  revisionsApplied: string[];
  excludedFeatures: string[];
  ignoredExternalPeople: string[];
  generatedAt?: string;
}

export interface TaskUpdateInput {
  title: string;
  description: string;
  assigneeId: string;
  deadline: string;
  estimatedHours: number;
}

export interface RawTranscriptTask {
  title: unknown;
  description: unknown;
  assigneeId: unknown;
  deadline: unknown;
  estimatedHours: unknown;
}

export interface RawTranscriptProject {
  name: unknown;
  clientName: unknown;
  description: unknown;
  managerId: unknown;
  deadline: unknown;
  tasks: unknown;
}

export interface TranscriptExtractionResult {
  projects: Project[];
  auditSummary?: AuditSummary;
  errors: string[];
}

export type AppView = 'dashboard' | 'project-detail' | 'my-tasks' | 'team';
