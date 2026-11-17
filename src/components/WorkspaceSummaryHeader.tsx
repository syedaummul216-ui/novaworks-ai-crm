import React from 'react';
import type { SafeUser } from '../types/crm';

interface WorkspaceSummaryHeaderProps {
  user: SafeUser;
  visibleProjectsCount: number;
  assignedTasksCount: number;
  totalCommittedHours: number;
  now?: Date;
}

export function getTimeOfDayGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

function getWorkspaceSubtitle(user: SafeUser): string {
  if (user.role === 'ADMIN') {
    return `${user.specialization} • Company Delivery Workspace`;
  }
  if (user.role === 'MANAGER') {
    return `${user.specialization} • Client Delivery Workspace`;
  }
  return `${user.specialization} • Personal Task Workspace`;
}

export const WorkspaceSummaryHeader: React.FC<WorkspaceSummaryHeaderProps> = ({
  user,
  visibleProjectsCount,
  assignedTasksCount,
  totalCommittedHours,
  now,
}) => {
  const greeting = getTimeOfDayGreeting(now);
  const subtitle = getWorkspaceSubtitle(user);

  return (
    <div className="space-y-5">
      {/* Dynamic Time-of-Day Greeting Header */}
      <div>
        <h1 className="text-2xl sm:text-[26px] font-bold text-[#0f172a] tracking-tight leading-snug">
          {greeting}, {user.name}
        </h1>
        <p className="text-sm text-[#475569] mt-1">{subtitle}</p>
      </div>

      {/* Role-Scoped 3-Card KPI Summary Strip (no progress bars, percentages, or cost fields) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl px-5 py-4 shadow-[0_1px_3px_0_rgba(15,23,42,0.03),0_1px_2px_-1px_rgba(15,23,42,0.02)] transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-indigo-300">
          <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
            Visible Projects
          </div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-[#0f172a]">
            {visibleProjectsCount}
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl px-5 py-4 shadow-[0_1px_3px_0_rgba(15,23,42,0.03),0_1px_2px_-1px_rgba(15,23,42,0.02)] transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-indigo-300">
          <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
            Assigned Tasks
          </div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-[#0f172a]">
            {assignedTasksCount}
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl px-5 py-4 shadow-[0_1px_3px_0_rgba(15,23,42,0.03),0_1px_2px_-1px_rgba(15,23,42,0.02)] transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-indigo-300">
          <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
            Total Committed Effort
          </div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            {totalCommittedHours} hrs
          </div>
        </div>
      </div>
    </div>
  );
};
