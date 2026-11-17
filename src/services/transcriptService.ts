import { getPublicTeamDirectory } from '../data/team';
import type {
  AuditSummary,
  Project,
  ProjectTask,
  RawTranscriptProject,
  RawTranscriptTask,
  SafeUser,
  TranscriptExtractionResult,
} from '../types/crm';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_FALLBACK_MODELS = [
  'openrouter/free',
  'google/gemini-2.0-flash-exp:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'qwen/qwen-2.5-72b-instruct:free',
] as const;

export function isValidIsoDate2026(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year !== 2026) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function buildSanitizedTeamContext() {
  // Strictly send IDs, names, roles, specialization, and skills ONLY — NO passwords or emails.
  return getPublicTeamDirectory().map((member) => ({
    id: member.id,
    name: member.name,
    role: member.role,
    specialization: member.specialization,
    skills: member.skills,
  }));
}

function buildSystemPrompt(): string {
  const teamRoster = buildSanitizedTeamContext();

  return `You are a strict enterprise project scope extractor for NovaWorks Technologies.
Given a meeting transcript and the NovaWorks team directory below, extract ONLY the final agreed projects and tasks into strict JSON.

TEAM DIRECTORY (IDs, names, roles, skills only):
${JSON.stringify(teamRoster, null, 2)}

EXTRACTION RULES (CRITICAL):
1. Extract ONLY final agreed decisions.
2. Apply ALL mid-meeting revisions: if a deadline, estimatedHours, scope, or owner is changed later in the conversation, output ONLY the final revised value.
3. Ignore rejected or excluded features (such as payment, inventory, maps, live tracking, email sending, or anything explicitly deferred/dropped).
4. Ignore external non-employees (such as Kamran or any client/vendor person not in the team directory). Never assign a project or task to an external person.
5. Format ALL dates strictly as YYYY-MM-DD in the year 2026.
6. Every project "managerId" MUST be an exact ID from the team directory whose role is "MANAGER" (PM01, PM02, or PM03).
7. Every task "assigneeId" MUST be an exact ID from the team directory whose role is "AGENT" (DEV01 through DEV06).
8. Every task "estimatedHours" MUST be a positive number (> 0).
9. Every task "deadline" MUST be on or before its parent project's "deadline" (task.deadline <= project.deadline).
10. Also return an "auditSummary" object summarizing:
   - "revisionsApplied": concise bullet strings of any mid-meeting revisions applied (e.g., updated dates, hours, or owners).
   - "excludedFeatures": concise bullet strings of rejected/deferred/excluded features filtered out (e.g., payment, inventory, maps, live tracking, email sending).
   - "ignoredExternalPeople": concise bullet strings of external non-employees ignored (e.g., Kamran).
11. Return ONLY valid JSON with NO markdown formatting, NO commentary, and NO extra keys, using this exact schema:
{
  "projects": [
    {
      "name": "",
      "clientName": "",
      "description": "",
      "managerId": "PM01",
      "deadline": "2026-10-20",
      "tasks": [
        {
          "title": "",
          "description": "",
          "assigneeId": "DEV01",
          "deadline": "2026-10-12",
          "estimatedHours": 12
        }
      ]
    }
  ],
  "auditSummary": {
    "revisionsApplied": ["..."],
    "excludedFeatures": ["..."],
    "ignoredExternalPeople": ["..."]
  }
}`;
}

export function extractJsonPayload(rawContent: string): unknown {
  let candidate = rawContent.trim();

  // Strip markdown code fences (e.g. ```json ... ``` or ``` ... ```)
  candidate = candidate.replace(/```(?:json)?\s*([\s\S]*?)```/gi, '$1').trim();

  // Slice from first '{' to last '}' before JSON.parse()
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const sliced = candidate.slice(firstBrace, lastBrace + 1);
    return JSON.parse(sliced);
  }

  return JSON.parse(candidate);
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseAuditSummary(payload: Record<string, unknown>): AuditSummary {
  const rawSummary = payload.auditSummary;
  if (!rawSummary || typeof rawSummary !== 'object') {
    return {
      revisionsApplied: [],
      excludedFeatures: [],
      ignoredExternalPeople: [],
      generatedAt: new Date().toISOString(),
    };
  }

  const record = rawSummary as Record<string, unknown>;
  return {
    revisionsApplied: normalizeStringArray(record.revisionsApplied),
    excludedFeatures: normalizeStringArray(record.excludedFeatures),
    ignoredExternalPeople: normalizeStringArray(record.ignoredExternalPeople),
    generatedAt: new Date().toISOString(),
  };
}

export function validateExtractedPayload(payload: unknown): TranscriptExtractionResult {
  const errors: string[] = [];
  const team = getPublicTeamDirectory();
  const managerMap = new Map(
    team.filter((m) => m.role === 'MANAGER').map((m) => [m.id, m])
  );
  const agentMap = new Map(
    team.filter((m) => m.role === 'AGENT').map((m) => [m.id, m])
  );

  if (!payload || typeof payload !== 'object' || !('projects' in payload)) {
    return {
      projects: [],
      errors: ['Response JSON is missing the top-level "projects" array.'],
    };
  }

  const rawProjects = (payload as { projects: unknown }).projects;
  if (!Array.isArray(rawProjects) || rawProjects.length === 0) {
    return {
      projects: [],
      errors: ['No agreed projects were found in the extracted "projects" array.'],
    };
  }

  const validatedProjects: Project[] = [];
  const timestamp = Date.now();

  rawProjects.forEach((item, projectIdx) => {
    const rawProject = item as RawTranscriptProject;
    const label =
      typeof rawProject?.name === 'string' && rawProject.name.trim()
        ? `Project "${rawProject.name.trim()}"`
        : `Project #${projectIdx + 1}`;

    const projectName = typeof rawProject?.name === 'string' ? rawProject.name.trim() : '';
    const clientName =
      typeof rawProject?.clientName === 'string' ? rawProject.clientName.trim() : '';
    const description =
      typeof rawProject?.description === 'string' ? rawProject.description.trim() : '';
    const managerId =
      typeof rawProject?.managerId === 'string' ? rawProject.managerId.trim() : '';
    const projectDeadline =
      typeof rawProject?.deadline === 'string' ? rawProject.deadline.trim() : '';

    if (!projectName) {
      errors.push(`${label}: Missing project "name".`);
    }
    if (!clientName) {
      errors.push(`${label}: Missing "clientName".`);
    }
    if (!description) {
      errors.push(`${label}: Missing project "description".`);
    }
    if (!managerId || !managerMap.has(managerId)) {
      errors.push(
        `${label}: Invalid or unresolved managerId "${managerId || 'empty'}" (must be a MANAGER: PM01, PM02, or PM03).`
      );
    }
    if (!isValidIsoDate2026(projectDeadline)) {
      errors.push(
        `${label}: Invalid project deadline "${projectDeadline || 'empty'}" (expected YYYY-MM-DD in 2026).`
      );
    }

    const rawTasks = rawProject?.tasks;
    if (!Array.isArray(rawTasks) || rawTasks.length === 0) {
      errors.push(`${label}: Must include at least one valid task in "tasks".`);
      return;
    }

    const validatedTasks: ProjectTask[] = [];

    rawTasks.forEach((taskItem, taskIdx) => {
      const rawTask = taskItem as RawTranscriptTask;
      const taskLabel =
        typeof rawTask?.title === 'string' && rawTask.title.trim()
          ? `${label} → Task "${rawTask.title.trim()}"`
          : `${label} → Task #${taskIdx + 1}`;

      const title = typeof rawTask?.title === 'string' ? rawTask.title.trim() : '';
      const taskDescription =
        typeof rawTask?.description === 'string' ? rawTask.description.trim() : '';
      const assigneeId =
        typeof rawTask?.assigneeId === 'string' ? rawTask.assigneeId.trim() : '';
      const taskDeadline =
        typeof rawTask?.deadline === 'string' ? rawTask.deadline.trim() : '';
      const estimatedHours = Number(rawTask?.estimatedHours);

      if (!title) {
        errors.push(`${taskLabel}: Missing task "title".`);
      }
      if (!taskDescription) {
        errors.push(`${taskLabel}: Missing task "description".`);
      }
      if (!assigneeId || !agentMap.has(assigneeId)) {
        errors.push(
          `${taskLabel}: Invalid or unresolved assigneeId "${assigneeId || 'empty'}" (must be an AGENT: DEV01–DEV06).`
        );
      }
      if (!Number.isFinite(estimatedHours) || estimatedHours <= 0) {
        errors.push(
          `${taskLabel}: Invalid estimatedHours "${String(rawTask?.estimatedHours ?? '')}" (must be > 0).`
        );
      }
      if (!isValidIsoDate2026(taskDeadline)) {
        errors.push(
          `${taskLabel}: Invalid task deadline "${taskDeadline || 'empty'}" (expected YYYY-MM-DD in 2026).`
        );
      } else if (isValidIsoDate2026(projectDeadline) && taskDeadline > projectDeadline) {
        errors.push(
          `${taskLabel}: Task deadline (${taskDeadline}) exceeds project deadline (${projectDeadline}).`
        );
      }

      validatedTasks.push({
        id: `task-${timestamp}-${projectIdx}-${taskIdx}-${Math.random().toString(36).slice(2, 6)}`,
        title,
        description: taskDescription,
        assigneeId,
        deadline: taskDeadline,
        estimatedHours,
      });
    });

    validatedProjects.push({
      id: `proj-${timestamp}-${projectIdx}-${Math.random().toString(36).slice(2, 6)}`,
      name: projectName,
      clientName,
      description,
      managerId,
      deadline: projectDeadline,
      createdAt: new Date().toISOString(),
      tasks: validatedTasks,
    });
  });

  // Atomic check: if ANY error exists, return ZERO projects so nothing is saved.
  if (errors.length > 0) {
    return {
      projects: [],
      errors,
    };
  }

  return {
    projects: validatedProjects,
    auditSummary: parseAuditSummary(payload as Record<string, unknown>),
    errors: [],
  };
}

function formatRawSnippet(raw: string): string {
  const compact = raw.replace(/\s+/g, ' ').trim();
  if (!compact) return '(empty body)';
  return compact.length > 260 ? `${compact.slice(0, 260)}...` : compact;
}

async function tryOpenRouterExtraction(params: {
  apiKey: string;
  systemPrompt: string;
  userPrompt: string;
}): Promise<{ rawText: string | null; debugErrors: string[] }> {
  const { apiKey, systemPrompt, userPrompt } = params;
  const debugErrors: string[] = [];

  for (const model of OPENROUTER_FALLBACK_MODELS) {
    let response: Response;
    try {
      // Do NOT pass response_format (many free OpenRouter models return empty content when forced)
      response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'NovaWorks Technologies CRM',
        },
        body: JSON.stringify({
          model,
          temperature: 0.1,
          max_tokens: 4096,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network request failed.';
      debugErrors.push(`OpenRouter [${model}] network error: ${msg}`);
      continue;
    }

    const rawBody = await response.text();
    const snippet = formatRawSnippet(rawBody);

    if (!response.ok) {
      debugErrors.push(`OpenRouter [${model}] HTTP ${response.status} — Response: ${snippet}`);
      continue;
    }

    let parsedEnvelope: {
      choices?: Array<{
        message?: {
          content?: unknown;
          reasoning?: unknown;
        };
      }>;
      error?: { message?: string };
    };

    try {
      parsedEnvelope = JSON.parse(rawBody);
    } catch {
      debugErrors.push(
        `OpenRouter [${model}] HTTP ${response.status} returned non-JSON envelope — Response: ${snippet}`
      );
      continue;
    }

    const message = parsedEnvelope?.choices?.[0]?.message;
    const content = typeof message?.content === 'string' ? message.content.trim() : '';
    if (content) {
      return { rawText: content, debugErrors };
    }

    // Fallback check: inspect message.reasoning if content is empty
    const reasoning = typeof message?.reasoning === 'string' ? message.reasoning.trim() : '';
    if (reasoning && reasoning.includes('{') && reasoning.includes('}')) {
      try {
        extractJsonPayload(reasoning);
        return { rawText: reasoning, debugErrors };
      } catch {
        // reasoning did not contain valid JSON; continue to next model
      }
    }

    debugErrors.push(
      `OpenRouter [${model}] HTTP ${response.status} returned empty message.content — Raw: ${snippet}`
    );
  }

  return { rawText: null, debugErrors };
}

async function tryGeminiServerFallback(params: {
  systemPrompt: string;
  userPrompt: string;
}): Promise<{ rawText: string | null; debugError: string | null }> {
  try {
    const response = await fetch('/api/gemini/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const rawBody = await response.text();
    const snippet = formatRawSnippet(rawBody);

    if (!response.ok) {
      return {
        rawText: null,
        debugError: `Gemini fallback HTTP ${response.status} — Response: ${snippet}`,
      };
    }

    const data = JSON.parse(rawBody) as { text?: unknown };
    const text = typeof data?.text === 'string' ? data.text.trim() : '';
    if (!text) {
      return {
        rawText: null,
        debugError: `Gemini fallback HTTP ${response.status} returned empty text — Raw: ${snippet}`,
      };
    }

    return { rawText: text, debugError: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network request failed.';
    return {
      rawText: null,
      debugError: `Gemini fallback error: ${msg}`,
    };
  }
}

export async function extractProjectsFromTranscript(params: {
  user: SafeUser;
  transcript: string;
  apiKeyInput: string;
}): Promise<TranscriptExtractionResult> {
  const { user, transcript, apiKeyInput } = params;

  if (user.role !== 'ADMIN') {
    return {
      projects: [],
      errors: ['Unauthorized: Only Admin users can run transcript extraction.'],
    };
  }

  const trimmedTranscript = transcript.trim();
  if (!trimmedTranscript) {
    return {
      projects: [],
      errors: ['Meeting transcript cannot be empty. Paste a meeting transcript to extract projects.'],
    };
  }

  const systemPrompt = buildSystemPrompt();
  const userPrompt = `Extract the final agreed NovaWorks projects and tasks from this meeting transcript:\n\n${trimmedTranscript}`;

  const resolvedOpenRouterKey =
    apiKeyInput.trim() || (import.meta.env.VITE_OPENROUTER_API_KEY ?? '').trim();

  const debugTrace: string[] = [];
  let completionText: string | null = null;

  // 1. Try OpenRouter with automatic 4-model fallback loop when key is available
  if (resolvedOpenRouterKey) {
    const openRouterAttempt = await tryOpenRouterExtraction({
      apiKey: resolvedOpenRouterKey,
      systemPrompt,
      userPrompt,
    });
    completionText = openRouterAttempt.rawText;
    debugTrace.push(...openRouterAttempt.debugErrors);
  } else {
    debugTrace.push('OpenRouter skipped: no OpenRouter API key entered or configured.');
  }

  // 2. Automatically fall back to server-side Gemini (@google/genai) if OpenRouter returned empty or failed
  if (!completionText) {
    const geminiAttempt = await tryGeminiServerFallback({
      systemPrompt,
      userPrompt,
    });
    completionText = geminiAttempt.rawText;
    if (geminiAttempt.debugError) {
      debugTrace.push(geminiAttempt.debugError);
    }
  }

  if (!completionText) {
    return {
      projects: [],
      errors:
        debugTrace.length > 0
          ? debugTrace
          : ['All AI extraction providers returned empty completion responses.'],
    };
  }

  try {
    const parsedJson = extractJsonPayload(completionText);
    return validateExtractedPayload(parsedJson);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid JSON output.';
    return {
      projects: [],
      errors: [
        `AI extraction failed to produce valid JSON: ${message}`,
        `Raw completion snippet: ${formatRawSnippet(completionText)}`,
      ],
    };
  }
}
