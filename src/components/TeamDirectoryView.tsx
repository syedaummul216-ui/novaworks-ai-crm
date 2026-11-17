import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { Role, SafeUser } from '../types/crm';

interface TeamDirectoryViewProps {
  members: SafeUser[];
  currentUserId: string;
}

type RoleFilter = 'ALL' | Role;

export const TeamDirectoryView: React.FC<TeamDirectoryViewProps> = ({
  members,
  currentUserId,
}) => {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return members.filter((member) => {
      if (roleFilter !== 'ALL' && member.role !== roleFilter) {
        return false;
      }
      if (!q) return true;
      return (
        member.name.toLowerCase().includes(q) ||
        member.id.toLowerCase().includes(q) ||
        member.specialization.toLowerCase().includes(q) ||
        member.skills.some((skill) => skill.toLowerCase().includes(q))
      );
    });
  }, [members, roleFilter, searchQuery]);

  const roleBadgeClass = (role: Role) => {
    if (role === 'ADMIN') {
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    }
    if (role === 'MANAGER') {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#0f172a] tracking-tight">
            Team Directory
          </h1>
          <p className="text-sm text-[#475569] mt-1">
            Read-only roster of all {members.length} NovaWorks Technologies leadership, management, and engineering staff.
          </p>
        </div>
      </div>

      {/* Interactive Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 bg-[#f1f5f9] border border-[#e2e8f0] rounded-lg self-start">
          {(
            [
              { id: 'ALL', label: `All (${members.length})` },
              { id: 'ADMIN', label: 'Admin' },
              { id: 'MANAGER', label: 'Managers' },
              { id: 'AGENT', label: 'Developers' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 active:scale-95 cursor-pointer whitespace-nowrap ${
                roleFilter === tab.id
                  ? 'bg-white text-[#0f172a] shadow-xs'
                  : 'text-[#475569] hover:text-[#0f172a]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, role, or skill..."
            aria-label="Search team directory"
            className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-lg text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredMembers.map((member) => {
          const isCurrentUser = member.id === currentUserId;
          return (
            <article
              key={member.id}
              className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.03),0_1px_2px_-1px_rgba(15,23,42,0.02)] flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-indigo-300"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-[#0f172a] truncate">
                        {member.name}
                      </h2>
                      {isCurrentUser && (
                        <span className="text-[11px] font-medium text-[#4338ca] shrink-0">
                          (You)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#64748b] mt-0.5 truncate">
                      {member.specialization}
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-semibold uppercase tracking-[0.04em] shrink-0 ${roleBadgeClass(
                      member.role
                    )}`}
                  >
                    {member.role}
                  </span>
                </div>

                <div className="mt-4 pt-3.5 border-t border-[#f1f5f9] space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-[#64748b]">Employee ID</span>
                    <span className="font-mono font-medium text-[#0f172a]">
                      {member.id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-[#64748b]">Email</span>
                    <span className="font-mono text-[#334155] truncate">
                      {member.email}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-[#f1f5f9]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b] mb-2">
                  Skills &amp; Focus
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {member.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-2 py-1 rounded-md bg-violet-50 border border-violet-200 text-xs font-medium text-violet-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
