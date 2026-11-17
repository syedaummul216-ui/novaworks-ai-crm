import React, { useState } from 'react';
import { ArrowRight, Trash2 } from 'lucide-react';
import type { EnrichedProject, Role } from '../types/crm';

interface ProjectCardProps {
  project: EnrichedProject;
  viewerRole: Role;
  onViewProject: (projectId: string) => void;
  onDeleteProject?: (projectId: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  viewerRole,
  onViewProject,
  onDeleteProject,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const getTopAccentBarClass = () => {
    const spec = project.managerSpecialization.toLowerCase();
    if (project.managerId === 'PM02' || spec.includes('mobile')) {
      return 'bg-gradient-to-r from-sky-500 to-cyan-500';
    }
    if (project.managerId === 'PM03' || spec.includes('ai')) {
      return 'bg-gradient-to-r from-violet-500 to-purple-600';
    }
    return 'bg-gradient-to-r from-indigo-500 to-indigo-600';
  };

  return (
    <article className="bg-white border border-slate-200/80 rounded-xl overflow-hidden flex flex-col justify-between shadow-[0_1px_3px_0_rgba(15,23,42,0.03),0_1px_2px_-1px_rgba(15,23,42,0.02)] transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-indigo-300">
      {/* Sleek 3px Top Accent Bar (Indigo for Web, Sky/Cyan for Mobile, Violet for AI) */}
      <div className={`h-[3px] w-full ${getTopAccentBarClass()}`} />

      {/* Card Body — strictly NO status or progress badges */}
      <div className="p-6 flex-1">
        <div className="text-xs font-medium text-[#64748b] truncate">
          {project.clientName}
        </div>
        <h3 className="text-base font-semibold text-[#0f172a] mt-1 leading-snug">
          {project.name}
        </h3>
        <p className="text-sm text-[#475569] mt-2.5 line-clamp-2 leading-relaxed">
          {project.description}
        </p>

        <dl className="mt-5 pt-4 border-t border-[#f1f5f9] grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
          <div>
            <dt className="text-[#64748b] font-medium">Assigned Manager</dt>
            <dd className="text-[#0f172a] font-semibold mt-0.5 truncate">
              {project.managerName}
            </dd>
          </div>
          <div>
            <dt className="text-[#64748b] font-medium">Deadline</dt>
            <dd className="font-mono tabular-nums text-[#0f172a] font-medium mt-0.5">
              {project.deadline}
            </dd>
          </div>
          <div>
            <dt className="text-[#64748b] font-medium">Deliverables</dt>
            <dd className="tabular-nums text-[#0f172a] font-medium mt-0.5">
              {project.tasks.length} {project.tasks.length === 1 ? 'task' : 'tasks'}
            </dd>
          </div>
          <div>
            <dt className="text-[#64748b] font-medium">Estimated Effort</dt>
            <dd className="font-mono tabular-nums text-[#0f172a] font-medium mt-0.5">
              {project.totalEstimatedHours} hrs
            </dd>
          </div>
        </dl>
      </div>

      {/* Card Footer */}
      <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onViewProject(project.id)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-violet-700 transition-all duration-150 active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <span>View Project</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {viewerRole === 'ADMIN' && onDeleteProject && (
          <div className="flex items-center gap-2 shrink-0">
            {confirmDelete ? (
              <>
                <button
                  type="button"
                  onClick={() => onDeleteProject(project.id)}
                  className="px-2.5 py-1 rounded text-xs font-medium bg-[#dc2626] hover:bg-[#b91c1c] text-white transition-all duration-150 active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1 rounded text-xs font-medium text-[#64748b] hover:text-[#0f172a] transition-all duration-150 active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                aria-label={`Delete ${project.name}`}
                className="p-1.5 rounded-md text-[#94a3b8] hover:text-[#dc2626] hover:bg-[#fef2f2] transition-all duration-150 active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
};
