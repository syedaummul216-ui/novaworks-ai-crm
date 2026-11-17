import type { AuditSummary, Project } from '../types/crm';

const PROJECTS_STORAGE_KEY = 'novaworks_crm_projects_v2';
const SESSION_USER_KEY = 'novaworks_crm_session_user_id';
const OPENROUTER_KEY_STORAGE_KEY = 'novaworks_crm_openrouter_key';
const AUDIT_SUMMARY_STORAGE_KEY = 'novaworks_crm_audit_summary_v1';

export function loadStoredProjects(): Project[] {
  try {
    const raw = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (raw === null) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed as Project[];
  } catch {
    return [];
  }
}

export function saveStoredProjects(projects: Project[]): void {
  window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
}

export function loadStoredAuditSummary(): AuditSummary | null {
  try {
    const raw = window.localStorage.getItem(AUDIT_SUMMARY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuditSummary>;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      revisionsApplied: Array.isArray(parsed.revisionsApplied)
        ? parsed.revisionsApplied.filter((v): v is string => typeof v === 'string')
        : [],
      excludedFeatures: Array.isArray(parsed.excludedFeatures)
        ? parsed.excludedFeatures.filter((v): v is string => typeof v === 'string')
        : [],
      ignoredExternalPeople: Array.isArray(parsed.ignoredExternalPeople)
        ? parsed.ignoredExternalPeople.filter((v): v is string => typeof v === 'string')
        : [],
      generatedAt: typeof parsed.generatedAt === 'string' ? parsed.generatedAt : undefined,
    };
  } catch {
    return null;
  }
}

export function saveStoredAuditSummary(summary: AuditSummary | null): void {
  if (!summary) {
    window.localStorage.removeItem(AUDIT_SUMMARY_STORAGE_KEY);
  } else {
    window.localStorage.setItem(AUDIT_SUMMARY_STORAGE_KEY, JSON.stringify(summary));
  }
}

export function loadStoredSessionUserId(): string | null {
  try {
    return window.localStorage.getItem(SESSION_USER_KEY);
  } catch {
    return null;
  }
}

export function saveStoredSessionUserId(userId: string | null): void {
  if (userId === null) {
    window.localStorage.removeItem(SESSION_USER_KEY);
  } else {
    window.localStorage.setItem(SESSION_USER_KEY, userId);
  }
}

export function loadStoredOpenRouterKey(): string {
  try {
    return window.localStorage.getItem(OPENROUTER_KEY_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveStoredOpenRouterKey(apiKey: string): void {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    window.localStorage.removeItem(OPENROUTER_KEY_STORAGE_KEY);
  } else {
    window.localStorage.setItem(OPENROUTER_KEY_STORAGE_KEY, trimmed);
  }
}
