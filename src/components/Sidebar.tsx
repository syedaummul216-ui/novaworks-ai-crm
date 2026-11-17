import React from 'react';
import { FolderKanban, CheckSquare, Users, LogOut, X } from 'lucide-react';
import type { AppView, SafeUser } from '../types/crm';

interface SidebarProps {
  user: SafeUser;
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeView,
  onNavigate,
  onLogout,
  mobileOpen,
  onCloseMobile,
}) => {
  const navItems: Array<{ id: AppView; label: string; icon: React.ReactNode }> = [];

  if (user.role === 'ADMIN' || user.role === 'MANAGER') {
    navItems.push({
      id: 'dashboard',
      label: user.role === 'ADMIN' ? 'Projects & Intake' : 'Assigned Projects',
      icon: <FolderKanban className="w-4 h-4 shrink-0" />,
    });
  }

  if (user.role === 'AGENT') {
    navItems.push({
      id: 'my-tasks',
      label: 'My Tasks',
      icon: <CheckSquare className="w-4 h-4 shrink-0" />,
    });
  }

  navItems.push({
    id: 'team',
    label: 'Team Directory',
    icon: <Users className="w-4 h-4 shrink-0" />,
  });

  const isNavActive = (itemId: AppView) => {
    if (itemId === 'dashboard' && activeView === 'project-detail') return true;
    return activeView === itemId;
  };

  const rolePillClass =
    user.role === 'ADMIN'
      ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
      : user.role === 'MANAGER'
        ? 'bg-amber-100 text-amber-800 border-amber-200'
        : 'bg-emerald-100 text-emerald-800 border-emerald-200';

  const sidebarContent = (
    <div className="flex flex-col h-full w-[260px] bg-slate-100/80 backdrop-blur-xs border-r border-slate-200/80">
      {/* Brand header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200/80 bg-white/95">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 shadow-sm shadow-indigo-500/25 flex items-center justify-center text-white text-xs font-bold tracking-tight shrink-0">
            NW
          </div>
          <span className="text-sm font-bold text-[#0f172a] tracking-tight truncate">
            NovaWorks CRM
          </span>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden p-1.5 rounded-md text-[#64748b] hover:text-[#0f172a] hover:bg-slate-100 transition-all duration-150 active:scale-95 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748b]">
          Workspace
        </div>
        {navItems.map((item) => {
          const active = isNavActive(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onNavigate(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 active:scale-95 cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-500/25'
                  : 'text-[#334155] hover:bg-white hover:text-[#0f172a] hover:shadow-xs'
              }`}
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Current User Footer */}
      <div className="p-4 border-t border-slate-200/80 bg-white/95">
        <div className="mb-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-[#0f172a] truncate">
              {user.name}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-[0.04em] shrink-0 ${rolePillClass}`}
            >
              {user.role}
            </span>
          </div>
          <div className="text-xs text-[#64748b] mt-1 truncate">
            <span className="font-mono text-indigo-700 font-medium">{user.id}</span> ·{' '}
            {user.specialization}
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="w-full h-9 inline-flex items-center justify-center gap-2 px-3 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 hover:border-indigo-300 text-xs font-medium text-[#334155] transition-all duration-150 active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:block shrink-0">{sidebarContent}</aside>

      {/* Mobile slide-over sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-[2px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-50 h-full">{sidebarContent}</aside>
        </div>
      )}
    </>
  );
};
