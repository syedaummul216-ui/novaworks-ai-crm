import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Copy,
  Pencil,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';
import { getAssignableAgents } from '../services/crmService';
import type { EnrichedProject, EnrichedProjectTask, SafeUser, TaskUpdateInput } from '../types/crm';

interface ProjectDetailScreenProps {
  user: SafeUser;
  project: EnrichedProject | null;
  onBack: () => void;
  onUpdateTask: (
    projectId: string,
    taskId: string,
    input: TaskUpdateInput
  ) => { project: EnrichedProject | null; errors: string[] };
}

export function formatProjectHandoffBrief(project: EnrichedProject): string {
  const taskLines = project.tasks.map(
    (task) =>
      `- ${task.title} | Assignee: ${task.assigneeName} (${task.assigneeId}) | Deadline: ${task.deadline} | Hours: ${task.estimatedHours} hrs\n  Scope: ${task.description}`
  );

  return [
    `Project: ${project.name}`,
    `Client: ${project.clientName}`,
    `Manager: ${project.managerName} (${project.managerId} · ${project.managerSpecialization})`,
    `Deadline: ${project.deadline}`,
    `Total Estimated Effort: ${project.totalEstimatedHours} hrs (${project.tasks.length} ${
      project.tasks.length === 1 ? 'task' : 'tasks'
    })`,
    '',
    'Tasks:',
    ...taskLines,
  ].join('\n');
}

export const ProjectDetailScreen: React.FC<ProjectDetailScreenProps> = ({
  user,
  project,
  onBack,
  onUpdateTask,
}) => {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftAssigneeId, setDraftAssigneeId] = useState('');
  const [draftDeadline, setDraftDeadline] = useState('');
  const [draftHours, setDraftHours] = useState('');
  const [editErrors, setEditErrors] = useState<string[]>([]);
  const [taskSearch, setTaskSearch] = useState('');
  const [copiedToast, setCopiedToast] = useState(false);

  const assignableAgents = useMemo(() => getAssignableAgents(), []);

  useEffect(() => {
    if (!copiedToast) return;
    const timer = window.setTimeout(() => setCopiedToast(false), 3000);
    return () => window.clearTimeout(timer);
  }, [copiedToast]);

  const filteredTasks = useMemo(() => {
    if (!project) return [];
    const q = taskSearch.trim().toLowerCase();
    if (!q) return project.tasks;
    return project.tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(q) ||
        task.description.toLowerCase().includes(q) ||
        task.assigneeName.toLowerCase().includes(q) ||
        task.assigneeId.toLowerCase().includes(q)
    );
  }, [project, taskSearch]);

  if (!project) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-xl p-10 text-center max-w-xl mx-auto mt-8">
        <ShieldAlert className="w-8 h-8 text-[#b91c1c] mx-auto mb-3" />
        <h1 className="text-base font-semibold text-[#0f172a]">
          Project Unavailable
        </h1>
        <p className="text-sm text-[#475569] mt-1">
          This project does not exist or is outside your role-based access scope.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-5 h-9 px-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-medium shadow-md shadow-indigo-500/25 transition-all duration-150 active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Workspace</span>
        </button>
      </div>
    );
  }

  const canEditTasks =
    user.role === 'ADMIN' || (user.role === 'MANAGER' && project.managerId === user.id);

  const startEditing = (task: EnrichedProjectTask) => {
    setEditingTaskId(task.id);
    setDraftTitle(task.title);
    setDraftDescription(task.description);
    setDraftAssigneeId(task.assigneeId);
    setDraftDeadline(task.deadline);
    setDraftHours(String(task.estimatedHours));
    setEditErrors([]);
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditErrors([]);
  };

  const handleSaveTask = (taskId: string) => {
    const result = onUpdateTask(project.id, taskId, {
      title: draftTitle,
      description: draftDescription,
      assigneeId: draftAssigneeId,
      deadline: draftDeadline,
      estimatedHours: Number(draftHours),
    });

    if (result.errors.length > 0 || !result.project) {
      setEditErrors(
        result.errors.length > 0 ? result.errors : ['Unable to save task changes.']
      );
      return;
    }

    setEditingTaskId(null);
    setEditErrors([]);
  };

  const handleCopyBrief = async () => {
    const brief = formatProjectHandoffBrief(project);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(brief);
      } else {
        throw new Error('Clipboard API unavailable');
      }
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = brief;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedToast(true);
  };

  return (
    <div className="space-y-6">
      {copiedToast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full border border-emerald-500 bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-emerald-900/15 animate-toast-in"
        >
          <Check className="w-4 h-4 shrink-0" />
          <span>Brief copied to clipboard!</span>
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#475569] hover:text-indigo-600 transition-all duration-150 active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </button>
      </div>

      {/* Project Summary Header Card */}
      <section className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-8 shadow-[0_1px_3px_0_rgba(15,23,42,0.03),0_1px_2px_-1px_rgba(15,23,42,0.02)]">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-[0.04em] text-indigo-600">
              {project.clientName}
            </div>
            <h1 className="text-2xl font-semibold text-[#0f172a] tracking-tight mt-1">
              {project.name}
            </h1>
            <p className="text-sm text-[#475569] mt-2.5 max-w-3xl leading-relaxed">
              {project.description}
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyBrief}
            className="h-9 px-3.5 inline-flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white hover:bg-indigo-50/60 hover:border-indigo-300 text-xs font-medium text-[#0f172a] transition-all duration-150 active:scale-95 cursor-pointer whitespace-nowrap shrink-0 self-start"
          >
            {copiedToast ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-[#475569]" />
            )}
            <span>Copy Handoff Brief</span>
          </button>
        </div>

        <dl className="mt-6 pt-5 border-t border-[#f1f5f9] grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
              Client Name
            </dt>
            <dd className="text-sm font-semibold text-[#0f172a] mt-1">
              {project.clientName}
            </dd>
          </div>

          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
              Assigned Manager
            </dt>
            <dd className="text-sm font-semibold text-[#0f172a] mt-1">
              {project.managerName}
              <span className="block text-xs font-normal text-[#64748b]">
                {project.managerId} · {project.managerSpecialization}
              </span>
            </dd>
          </div>

          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
              Project Deadline
            </dt>
            <dd className="font-mono tabular-nums text-sm font-semibold text-[#0f172a] mt-1">
              {project.deadline}
            </dd>
          </div>

          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
              Total Estimated Effort
            </dt>
            <dd className="font-mono tabular-nums text-sm font-semibold text-[#0f172a] mt-1">
              {project.totalEstimatedHours} hrs ({project.tasks.length}{' '}
              {project.tasks.length === 1 ? 'task' : 'tasks'})
            </dd>
          </div>
        </dl>
      </section>

      {/* Deliverable Task Table */}
      <section className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-[0_1px_3px_0_rgba(15,23,42,0.03),0_1px_2px_-1px_rgba(15,23,42,0.02)]">
        <div className="px-6 py-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#0f172a]">
              Project Task Schedule
            </h2>
            <p className="text-xs text-[#64748b] mt-0.5">
              Scoped engineering deliverables, assigned developers, matched skills, deadlines, and effort estimates.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                placeholder="Search title, scope, developer..."
                aria-label="Filter project tasks"
                className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-lg text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
              />
            </div>
            <span className="font-mono tabular-nums text-xs font-medium text-[#475569] whitespace-nowrap">
              {filteredTasks.length} / {project.tasks.length}
            </span>
          </div>
        </div>

        {editErrors.length > 0 && (
          <div
            role="alert"
            className="mx-6 mt-4 rounded-lg border border-[#fecaca] bg-[#fef2f2] p-3.5 text-xs text-[#b91c1c] flex items-start justify-between gap-3"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#991b1b]">Task update rejected:</span>
                <ul className="mt-1 list-disc list-inside space-y-0.5">
                  {editErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditErrors([])}
              aria-label="Dismiss edit error"
              className="p-0.5 rounded hover:bg-[#fee2e2] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                <th className="py-3 px-6 text-[11px] font-bold uppercase tracking-[0.05em] text-[#475569]">
                  Task Title
                </th>
                <th className="py-3 px-6 text-[11px] font-bold uppercase tracking-[0.05em] text-[#475569]">
                  Scope Description
                </th>
                <th className="py-3 px-6 text-[11px] font-bold uppercase tracking-[0.05em] text-[#475569] whitespace-nowrap">
                  Assigned Developer
                </th>
                <th className="py-3 px-6 text-[11px] font-bold uppercase tracking-[0.05em] text-[#475569] whitespace-nowrap">
                  Deadline
                </th>
                <th className="py-3 px-6 text-[11px] font-bold uppercase tracking-[0.05em] text-[#475569] text-right whitespace-nowrap">
                  Estimated Hours
                </th>
                {canEditTasks && (
                  <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-[0.05em] text-[#475569] text-right whitespace-nowrap">
                    Edit
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td
                    colSpan={canEditTasks ? 6 : 5}
                    className="py-10 px-6 text-center text-sm text-[#64748b]"
                  >
                    No tasks match your search filter.{' '}
                    <button
                      type="button"
                      onClick={() => setTaskSearch('')}
                      className="text-[#4338ca] hover:underline font-medium cursor-pointer"
                    >
                      Clear search
                    </button>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                const isEditing = canEditTasks && editingTaskId === task.id;

                if (isEditing) {
                  return (
                    <tr key={task.id} className="bg-indigo-50/40">
                      <td className="py-3 px-6 align-top min-w-[200px]">
                        <input
                          type="text"
                          value={draftTitle}
                          onChange={(e) => setDraftTitle(e.target.value)}
                          aria-label="Task title"
                          className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                        />
                      </td>
                      <td className="py-3 px-6 align-top min-w-[280px]">
                        <textarea
                          rows={2}
                          value={draftDescription}
                          onChange={(e) => setDraftDescription(e.target.value)}
                          aria-label="Scope description"
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                        />
                      </td>
                      <td className="py-3 px-6 align-top min-w-[200px]">
                        <select
                          value={draftAssigneeId}
                          onChange={(e) => setDraftAssigneeId(e.target.value)}
                          aria-label="Assigned developer"
                          className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                        >
                          {assignableAgents.map((agent) => (
                            <option key={agent.id} value={agent.id}>
                              {agent.name} ({agent.id} · {agent.specialization})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-6 align-top whitespace-nowrap">
                        <input
                          type="date"
                          value={draftDeadline}
                          max={project.deadline}
                          onChange={(e) => setDraftDeadline(e.target.value)}
                          aria-label="Task deadline"
                          className="h-9 px-2.5 bg-white border border-slate-300 rounded-lg font-mono text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                        />
                      </td>
                      <td className="py-3 px-6 align-top text-right whitespace-nowrap">
                        <input
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={draftHours}
                          onChange={(e) => setDraftHours(e.target.value)}
                          aria-label="Estimated hours"
                          className="w-24 h-9 px-2.5 text-right bg-white border border-slate-300 rounded-lg font-mono text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                        />
                      </td>
                      <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSaveTask(task.id)}
                            aria-label="Save task"
                            className="p-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-sm shadow-indigo-500/25 cursor-pointer transition-all duration-150 active:scale-95"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditing}
                            aria-label="Cancel editing"
                            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[#475569] cursor-pointer transition-all duration-150 active:scale-95"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={task.id} className="transition-colors duration-150 hover:bg-indigo-50/50">
                    <td className="py-4 px-6 align-top text-sm font-semibold text-[#0f172a] min-w-[200px]">
                      {task.title}
                    </td>
                    <td className="py-4 px-6 align-top text-sm text-[#475569] leading-relaxed min-w-[280px]">
                      {task.description}
                    </td>
                    <td className="py-4 px-6 align-top whitespace-nowrap">
                      <div className="text-sm font-medium text-[#0f172a]">
                        {task.assigneeName}
                      </div>
                      <div className="text-xs text-[#64748b] font-mono">
                        {task.assigneeId} · {task.assigneeSpecialization}
                      </div>
                      <span className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-md bg-violet-50 border border-violet-200 text-violet-700 text-[11px] font-medium whitespace-nowrap">
                        Skill: {task.matchedSkill}
                      </span>
                    </td>
                    <td className="py-4 px-6 align-top font-mono tabular-nums text-sm text-[#0f172a] whitespace-nowrap">
                      {task.deadline}
                    </td>
                    <td className="py-4 px-6 align-top font-mono tabular-nums text-sm font-semibold text-[#0f172a] text-right whitespace-nowrap">
                      {task.estimatedHours} hrs
                    </td>
                    {canEditTasks && (
                      <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => startEditing(task)}
                          aria-label={`Edit ${task.title}`}
                          className="p-1.5 rounded-lg text-[#64748b] hover:text-indigo-700 hover:bg-indigo-100/80 transition-all duration-150 active:scale-95 cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
