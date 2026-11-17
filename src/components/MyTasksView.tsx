import React, { useMemo, useState } from 'react';
import { CheckSquare, Search } from 'lucide-react';
import type { AgentTaskItem, SafeUser } from '../types/crm';
import { WorkspaceSummaryHeader } from './WorkspaceSummaryHeader';

interface MyTasksViewProps {
  user: SafeUser;
  tasks: AgentTaskItem[];
}

export const MyTasksView: React.FC<MyTasksViewProps> = ({ user, tasks }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.projectName.toLowerCase().includes(q) ||
        t.managerName.toLowerCase().includes(q)
    );
  }, [tasks, searchQuery]);

  const totalHours = useMemo(
    () => tasks.reduce((sum, task) => sum + task.estimatedHours, 0),
    [tasks]
  );

  const uniqueProjectCount = useMemo(
    () => new Set(tasks.map((t) => t.projectId)).size,
    [tasks]
  );

  return (
    <div className="space-y-8">
      <WorkspaceSummaryHeader
        user={user}
        visibleProjectsCount={uniqueProjectCount}
        assignedTasksCount={tasks.length}
        totalCommittedHours={totalHours}
      />

      {/* Filter Bar & Table */}
      <section className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-[0_1px_3px_0_rgba(15,23,42,0.03),0_1px_2px_-1px_rgba(15,23,42,0.02)]">
        <div className="px-6 py-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#0f172a]">
              My Assigned Tasks
            </h2>
            <p className="text-xs text-[#64748b] mt-0.5">
              Scoped deliverables assigned directly to {user.name}.
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by title or description..."
              aria-label="Filter assigned tasks"
              className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-lg text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="p-10 text-center">
            <CheckSquare className="w-8 h-8 text-[#94a3b8] mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-[#0f172a]">
              {searchQuery ? 'No matching tasks found' : 'No tasks assigned yet'}
            </h3>
            <p className="text-xs text-[#64748b] mt-1 max-w-md mx-auto">
              {searchQuery
                ? 'Try adjusting your search keywords.'
                : 'Your assigned project deliverables will appear here once scheduled.'}
            </p>
          </div>
        ) : (
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
                    Parent Project
                  </th>
                  <th className="py-3 px-6 text-[11px] font-bold uppercase tracking-[0.05em] text-[#475569] whitespace-nowrap">
                    Project Manager
                  </th>
                  <th className="py-3 px-6 text-[11px] font-bold uppercase tracking-[0.05em] text-[#475569] whitespace-nowrap">
                    Deadline
                  </th>
                  <th className="py-3 px-6 text-[11px] font-bold uppercase tracking-[0.05em] text-[#475569] text-right whitespace-nowrap">
                    Est. Hours
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="transition-colors duration-150 hover:bg-indigo-50/50">
                    <td className="py-4 px-6 align-top text-sm font-semibold text-[#0f172a] min-w-[200px]">
                      <div>{task.title}</div>
                      <span className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-md bg-violet-50 border border-violet-200 text-violet-700 text-[11px] font-medium whitespace-nowrap">
                        Skill: {task.matchedSkill}
                      </span>
                    </td>
                    <td className="py-4 px-6 align-top text-sm text-[#475569] leading-relaxed min-w-[260px]">
                      {task.description}
                    </td>
                    <td className="py-4 px-6 align-top whitespace-nowrap">
                      <div className="text-sm font-medium text-[#0f172a]">
                        {task.projectName}
                      </div>
                      <div className="text-xs text-[#64748b]">
                        {task.clientName}
                      </div>
                    </td>
                    <td className="py-4 px-6 align-top whitespace-nowrap">
                      <div className="text-sm font-medium text-[#0f172a]">
                        {task.managerName}
                      </div>
                      <div className="text-xs font-mono text-[#64748b]">
                        {task.managerId}
                      </div>
                    </td>
                    <td className="py-4 px-6 align-top font-mono tabular-nums text-sm text-[#0f172a] whitespace-nowrap">
                      {task.deadline}
                    </td>
                    <td className="py-4 px-6 align-top font-mono tabular-nums text-sm font-semibold text-[#0f172a] text-right whitespace-nowrap">
                      {task.estimatedHours} hrs
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
