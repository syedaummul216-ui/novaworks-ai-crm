import { useCallback, useMemo, useState } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { MyTasksView } from './components/MyTasksView';
import { ProjectDetailScreen } from './components/ProjectDetailScreen';
import { ProjectsDashboard } from './components/ProjectsDashboard';
import { Sidebar } from './components/Sidebar';
import { TeamDirectoryView } from './components/TeamDirectoryView';
import { TopBar } from './components/TopBar';
import { logoutSession, restoreSession } from './services/authService';
import {
  deleteProjectForUser,
  getProjectByIdForUser,
  getProjectsForUser,
  getTasksForUser,
  getTeamDirectory,
  saveValidatedProjects,
  updateProjectTaskForUser,
} from './services/crmService';
import type { AppView, Project, SafeUser, TaskUpdateInput } from './types/crm';

function getDefaultViewForRole(user: SafeUser): AppView {
  return user.role === 'AGENT' ? 'my-tasks' : 'dashboard';
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<SafeUser | null>(() => restoreSession());
  const [activeView, setActiveView] = useState<AppView>(() => {
    const restored = restoreSession();
    return restored ? getDefaultViewForRole(restored) : 'dashboard';
  });
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [dataRevision, setDataRevision] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const teamDirectory = useMemo(() => getTeamDirectory(), []);

  // Strict role-based data reads enforced inside crmService
  const visibleProjects = useMemo(() => {
    if (!currentUser) return [];
    void dataRevision;
    return getProjectsForUser(currentUser);
  }, [currentUser, dataRevision]);

  const selectedProject = useMemo(() => {
    if (!currentUser || !selectedProjectId) return null;
    void dataRevision;
    return getProjectByIdForUser(currentUser, selectedProjectId);
  }, [currentUser, selectedProjectId, dataRevision]);

  const visibleAgentTasks = useMemo(() => {
    if (!currentUser) return [];
    void dataRevision;
    return getTasksForUser(currentUser);
  }, [currentUser, dataRevision]);

  const handleLoginSuccess = useCallback((user: SafeUser) => {
    setCurrentUser(user);
    setSelectedProjectId(null);
    setActiveView(getDefaultViewForRole(user));
    setMobileMenuOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    logoutSession();
    setCurrentUser(null);
    setSelectedProjectId(null);
    setActiveView('dashboard');
    setMobileMenuOpen(false);
  }, []);

  const handleNavigate = useCallback(
    (view: AppView) => {
      if (!currentUser) return;
      // Guard navigation views by role in addition to service-layer enforcement
      if (currentUser.role === 'AGENT' && (view === 'dashboard' || view === 'project-detail')) {
        setActiveView('my-tasks');
        setSelectedProjectId(null);
        return;
      }
      if (view !== 'project-detail') {
        setSelectedProjectId(null);
      }
      setActiveView(view);
    },
    [currentUser]
  );

  const handleViewProject = useCallback(
    (projectId: string) => {
      if (!currentUser || currentUser.role === 'AGENT') return;
      setSelectedProjectId(projectId);
      setActiveView('project-detail');
    },
    [currentUser]
  );

  const handleProjectsSaved = useCallback(
    (newProjects: Project[]) => {
      if (!currentUser) return;
      saveValidatedProjects(currentUser, newProjects);
      setDataRevision((prev) => prev + 1);
    },
    [currentUser]
  );

  const handleDeleteProject = useCallback(
    (projectId: string) => {
      if (!currentUser) return;
      deleteProjectForUser(currentUser, projectId);
      if (selectedProjectId === projectId) {
        setSelectedProjectId(null);
        setActiveView('dashboard');
      }
      setDataRevision((prev) => prev + 1);
    },
    [currentUser, selectedProjectId]
  );

  const handleUpdateTask = useCallback(
    (projectId: string, taskId: string, input: TaskUpdateInput) => {
      if (!currentUser) {
        return { project: null, errors: ['Not authenticated.'] };
      }
      const res = updateProjectTaskForUser({
        user: currentUser,
        projectId,
        taskId,
        input,
      });
      if (res.project) {
        setDataRevision((prev) => prev + 1);
      }
      return res;
    },
    [currentUser]
  );

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen workspace-ambient-canvas flex">
      <Sidebar
        user={currentUser}
        activeView={activeView}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          user={currentUser}
          activeView={activeView}
          selectedProjectName={selectedProject?.name}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onNavigateDashboard={() => handleNavigate(getDefaultViewForRole(currentUser))}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1280px] w-full mx-auto">
          <div
            key={`${activeView}-${selectedProjectId ?? ''}`}
            className="animate-view-enter"
          >
            {activeView === 'team' ? (
              <TeamDirectoryView
                members={teamDirectory}
                currentUserId={currentUser.id}
              />
            ) : currentUser.role === 'AGENT' || activeView === 'my-tasks' ? (
              <MyTasksView user={currentUser} tasks={visibleAgentTasks} />
            ) : activeView === 'project-detail' ? (
              <ProjectDetailScreen
                user={currentUser}
                project={selectedProject}
                onBack={() => handleNavigate('dashboard')}
                onUpdateTask={handleUpdateTask}
              />
            ) : (
              <ProjectsDashboard
                user={currentUser}
                projects={visibleProjects}
                onProjectsSaved={handleProjectsSaved}
                onViewProject={handleViewProject}
                onDeleteProject={handleDeleteProject}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
