import React, { useMemo, useState } from 'react';
import { Search, FolderOpen } from 'lucide-react';
import type { EnrichedProject, Project, SafeUser } from '../types/crm';
import { ProjectCard } from './ProjectCard';
import { TranscriptIntakeCard } from './TranscriptIntakeCard';
import { WorkspaceSummaryHeader } from './WorkspaceSummaryHeader';

interface ProjectsDashboardProps {
  user: SafeUser;
  projects: EnrichedProject[];
  onProjectsSaved: (newProjects: Project[]) => void;
  onViewProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
}

export const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({
  user,
  projects,
  onProjectsSaved,
  onViewProject,
  onDeleteProject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q) ||
        p.managerName.toLowerCase().includes(q)
    );
  }, [projects, searchQuery]);

  const totalTasks = useMemo(
    () => projects.reduce((sum, p) => sum + p.tasks.length, 0),
    [projects]
  );

  const totalHours = useMemo(
    () => projects.reduce((sum, p) => sum + p.totalEstimatedHours, 0),
    [projects]
  );

  return (
    <div className="space-y-8">
      <WorkspaceSummaryHeader
        user={user}
        visibleProjectsCount={projects.length}
        assignedTasksCount={totalTasks}
        totalCommittedHours={totalHours}
      />

      {/* Admin Only: Create from Transcript Box */}
      {user.role === 'ADMIN' && (
        <TranscriptIntakeCard user={user} onProjectsSaved={onProjectsSaved} />
      )}

      {/* Projects Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-base font-semibold text-[#0f172a]">
            {user.role === 'ADMIN' ? 'Saved Projects' : 'Your Managed Projects'}
          </h2>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects, clients, managers..."
              aria-label="Search projects"
              className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200/80 rounded-lg text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-xl p-10 text-center">
            <FolderOpen className="w-8 h-8 text-[#94a3b8] mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-[#0f172a]">
              {searchQuery ? 'No matching projects found' : 'No projects available'}
            </h3>
            <p className="text-xs text-[#64748b] mt-1 max-w-md mx-auto">
              {searchQuery
                ? 'Try clearing your search query or checking another client or manager name.'
                : user.role === 'ADMIN'
                  ? 'Use the Create from Transcript box above to generate your next project.'
                  : 'No projects are currently assigned to your manager account.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                viewerRole={user.role}
                onViewProject={onViewProject}
                onDeleteProject={user.role === 'ADMIN' ? onDeleteProject : undefined}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
