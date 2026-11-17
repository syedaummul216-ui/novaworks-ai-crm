import React from 'react';
import { Menu } from 'lucide-react';
import type { AppView, SafeUser } from '../types/crm';

interface TopBarProps {
  user: SafeUser;
  activeView: AppView;
  selectedProjectName?: string;
  onOpenMobileMenu: () => void;
  onNavigateDashboard?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  user,
  activeView,
  selectedProjectName,
  onOpenMobileMenu,
  onNavigateDashboard,
}) => {
  const getSectionLabel = () => {
    if (activeView === 'my-tasks') return 'My Tasks';
    if (activeView === 'team') return 'Team Directory';
    if (activeView === 'project-detail') {
      return user.role === 'ADMIN' ? 'Projects' : 'Assigned Projects';
    }
    return user.role === 'ADMIN' ? 'Admin Dashboard' : 'Assigned Projects';
  };

  const roleBadgeClass =
    user.role === 'ADMIN'
      ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
      : user.role === 'MANAGER'
        ? 'bg-amber-100 text-amber-800 border-amber-200'
        : 'bg-emerald-100 text-emerald-800 border-emerald-200';

  return (
    <header className="h-16 bg-white/90 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 -ml-2 rounded-lg text-[#475569] hover:text-[#0f172a] hover:bg-slate-100 transition-all duration-150 active:scale-95 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm min-w-0">
          <span className="font-semibold text-[#0f172a] whitespace-nowrap shrink-0">
            NovaWorks Technologies
          </span>
          <span className="text-[#94a3b8]" aria-hidden="true">
            /
          </span>
          {activeView === 'project-detail' && selectedProjectName ? (
            <>
              <button
                type="button"
                onClick={onNavigateDashboard}
                className="text-[#475569] hover:text-indigo-600 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {getSectionLabel()}
              </button>
              <span className="text-[#94a3b8]" aria-hidden="true">
                /
              </span>
              <span className="font-medium text-[#0f172a] truncate">
                {selectedProjectName}
              </span>
            </>
          ) : (
            <span className="font-medium text-[#475569] whitespace-nowrap truncate">
              {getSectionLabel()}
            </span>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-3 shrink-0 text-xs text-[#475569] whitespace-nowrap">
        <span className="hidden sm:inline font-medium text-[#0f172a]">{user.name}</span>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-semibold uppercase tracking-[0.04em] ${roleBadgeClass}`}
        >
          {user.role}
        </span>
      </div>
    </header>
  );
};
