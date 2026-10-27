import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, SYSTEMS_CONFIG, isConfigured, SUPABASE_PROJECT_ID } from './lib/supabase';
import type { TaskItem, SystemInfo, StatusType, PriorityType, SystemStats, OverallStats } from './types';
import type { User } from '@supabase/supabase-js';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChecklistView } from './components/ChecklistView';
import { DashboardView } from './components/DashboardView';
import { TaskModal } from './components/TaskModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { LoginModal } from './components/LoginModal';
import { ToastContainer } from './components/Toast';
import type { ToastMessage } from './components/Toast';
import { KeyRound, ShieldAlert } from 'lucide-react';

// Status normalizer to safely handle casing discrepancies between DB tables ('Done', 'Not Started', etc.)
export const normalizeStatus = (raw: unknown): StatusType => {
  if (!raw) return 'not started';
  const s = String(raw).toLowerCase().trim();
  if (s === 'done' || s === 'completed') return 'done';
  if (s === 'working' || s === 'in progress' || s === 'in_progress') return 'working';
  return 'not started';
};

export function App() {
  const [systems] = useState<SystemInfo[]>(SYSTEMS_CONFIG);
  // Default to Dashboard view
  const [activeSystemId, setActiveSystemId] = useState<number | 'dashboard'>('dashboard');
  const [tasksBySystem, setTasksBySystem] = useState<Record<number, TaskItem[]>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [rlsWarning, setRlsWarning] = useState<string | null>(null);

  const configured = isConfigured();

  // Listen to Supabase auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    addToast('Signed out of team access', 'info');
  };

  // Modals state
  const [taskModalState, setTaskModalState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    task?: TaskItem | null;
  }>({
    isOpen: false,
    mode: 'create',
    task: null,
  });

  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    task: TaskItem | null;
  }>({
    isOpen: false,
    task: null,
  });

  // Toast helpers
  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch all tasks from all 7 child tables in parallel
  const fetchAllSystemsData = useCallback(async (showToast = false) => {
    if (!configured) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setRlsWarning(null);
      const results: Record<number, TaskItem[]> = {};

      const fetchPromises = systems.map(async (sys) => {
        const { data, error } = await supabase
          .from(sys.tableName)
          .select('*')
          .order('id', { ascending: true });

        if (error) {
          console.error(`Error fetching from ${sys.tableName}:`, error);
          results[sys.id] = [];
          if (error.code === '42501' || error.message?.includes('policy')) {
            setRlsWarning(
              `Row-Level Security (RLS) is blocking access on table "${sys.tableName}". Run "ALTER TABLE ${sys.tableName} DISABLE ROW LEVEL SECURITY;" in Supabase SQL Editor.`
            );
          }
        } else {
          // Normalize status
          const cleanData: TaskItem[] = (data || []).map((row: any) => ({
            id: row.id,
            system_id: row.system_id ?? sys.id,
            feature: row.feature || 'Untitled Feature',
            description: row.description || '',
            priority: (row.priority as PriorityType) || 'Medium',
            status: normalizeStatus(row.status),
          }));
          results[sys.id] = cleanData;
        }
      });

      await Promise.all(fetchPromises);
      setTasksBySystem(results);

      if (showToast) {
        addToast('Synced with Supabase database', 'info');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch data';
      addToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [systems, configured, addToast]);

  useEffect(() => {
    fetchAllSystemsData();
  }, [fetchAllSystemsData]);

  // Active system object
  const activeSystem = useMemo(() => {
    if (activeSystemId === 'dashboard') {
      return systems[0];
    }
    return systems.find((s) => s.id === activeSystemId) || systems[0];
  }, [systems, activeSystemId]);

  // Active system tasks
  const activeTasks = useMemo(() => {
    if (activeSystemId === 'dashboard') {
      return [];
    }
    return tasksBySystem[activeSystemId] || [];
  }, [tasksBySystem, activeSystemId]);

  // Calculate stats for each system
  const statsMap = useMemo(() => {
    const map: Record<number, SystemStats> = {};

    systems.forEach((sys) => {
      const items = tasksBySystem[sys.id] || [];
      const total = items.length;
      const done = items.filter((t) => t.status === 'done').length;
      const working = items.filter((t) => t.status === 'working').length;
      const notStarted = items.filter((t) => t.status === 'not started').length;
      const completionPercent = total === 0 ? 0 : Math.round((done / total) * 100);

      map[sys.id] = {
        total,
        done,
        working,
        notStarted,
        completionPercent,
      };
    });

    return map;
  }, [systems, tasksBySystem]);

  // Overall workspace stats across all systems
  const overallStats: OverallStats = useMemo(() => {
    let totalTasks = 0;
    let totalDone = 0;
    let totalWorking = 0;
    let totalNotStarted = 0;

    Object.values(statsMap).forEach((st) => {
      totalTasks += st.total;
      totalDone += st.done;
      totalWorking += st.working;
      totalNotStarted += st.notStarted;
    });

    const overallPercent = totalTasks === 0 ? 0 : Math.round((totalDone / totalTasks) * 100);

    return {
      totalTasks,
      totalDone,
      totalWorking,
      totalNotStarted,
      overallPercent,
    };
  }, [statsMap]);

  // Update status (mark as done, working, not started)
  const handleUpdateStatus = async (
    taskId: number,
    newStatus: StatusType,
    systemIdOverride?: number
  ) => {
    if (!configured) {
      addToast('Please configure Supabase credentials in src/lib/supabase.ts first', 'error');
      return;
    }

    const targetSysId =
      systemIdOverride ?? (typeof activeSystemId === 'number' ? activeSystemId : 1);
    const targetSystem = systems.find((s) => s.id === targetSysId) || activeSystem;

    const currentTasks = tasksBySystem[targetSysId] || [];
    const targetTask = currentTasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const previousStatus = targetTask.status;

    // Optimistic UI update
    setTasksBySystem((prev) => ({
      ...prev,
      [targetSysId]: (prev[targetSysId] || []).map((t) =>
        t.id === taskId ? { ...t, status: newStatus } : t
      ),
    }));

    try {
      const { error } = await supabase
        .from(targetSystem.tableName)
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) {
        throw error;
      }

      addToast(`Marked "${targetTask.feature}" as ${newStatus}`, 'success');
    } catch (err: unknown) {
      // Revert optimistic update
      setTasksBySystem((prev) => ({
        ...prev,
        [targetSysId]: (prev[targetSysId] || []).map((t) =>
          t.id === taskId ? { ...t, status: previousStatus } : t
        ),
      }));

      const msg = err instanceof Error ? err.message : 'Failed to update status';
      if (typeof msg === 'string' && (msg.includes('policy') || msg.includes('row-level security'))) {
        setRlsWarning(
          `Update blocked by RLS on table "${activeSystem.tableName}". Disable RLS or create a policy in Supabase SQL Editor.`
        );
      }
      addToast(msg, 'error');
    }
  };

  // Create or Update task
  const handleSaveTask = async (data: {
    feature: string;
    description: string;
    priority: PriorityType;
    status: StatusType;
  }) => {
    if (!configured) {
      addToast('Please configure Supabase credentials in src/lib/supabase.ts first', 'error');
      return;
    }

    if (taskModalState.mode === 'create') {
      const payload = {
        system_id: activeSystem.id,
        feature: data.feature,
        description: data.description,
        priority: data.priority,
        status: data.status,
      };

      const { data: inserted, error } = await supabase
        .from(activeSystem.tableName)
        .insert([payload])
        .select()
        .single();

      if (error) {
        if (error.code === '42501' || error.message?.includes('policy')) {
          setRlsWarning(
            `Insert blocked by RLS on table "${activeSystem.tableName}". Run "ALTER TABLE ${activeSystem.tableName} DISABLE ROW LEVEL SECURITY;" in Supabase SQL Editor.`
          );
        }
        throw error;
      }

      const newTask: TaskItem = {
        id: inserted.id,
        system_id: inserted.system_id ?? activeSystem.id,
        feature: inserted.feature,
        description: inserted.description,
        priority: inserted.priority,
        status: inserted.status,
      };

      const targetSysId = activeSystem.id;
      setTasksBySystem((prev) => ({
        ...prev,
        [targetSysId]: [...(prev[targetSysId] || []), newTask],
      }));

      addToast(`Created "${newTask.feature}" in ${activeSystem.name}`, 'success');
    } else if (taskModalState.mode === 'edit' && taskModalState.task) {
      const taskId = taskModalState.task.id;
      const targetSysId = activeSystem.id;
      const { data: updated, error } = await supabase
        .from(activeSystem.tableName)
        .update({
          feature: data.feature,
          description: data.description,
          priority: data.priority,
          status: data.status,
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setTasksBySystem((prev) => ({
        ...prev,
        [targetSysId]: (prev[targetSysId] || []).map((t) =>
          t.id === taskId
            ? {
                ...t,
                feature: updated.feature,
                description: updated.description,
                priority: updated.priority,
                status: updated.status,
              }
            : t
        ),
      }));

      addToast(`Updated "${data.feature}"`, 'success');
    }
  };

  // Delete task
  const handleDeleteTask = async () => {
    if (!deleteModalState.task || !configured) return;
    const taskToDelete = deleteModalState.task;
    const targetSysId = activeSystem.id;

    try {
      const { error } = await supabase
        .from(activeSystem.tableName)
        .delete()
        .eq('id', taskToDelete.id);

      if (error) {
        throw error;
      }

      setTasksBySystem((prev) => ({
        ...prev,
        [targetSysId]: (prev[targetSysId] || []).filter((t) => t.id !== taskToDelete.id),
      }));

      addToast(`Deleted "${taskToDelete.feature}"`, 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete task';
      addToast(msg, 'error');
    }
  };

  return (
    <div className="app-container">
      {/* Top Header with Global Stats and Supabase Status */}
      <Header
        totalTasks={overallStats.totalTasks}
        totalDone={overallStats.totalDone}
        totalWorking={overallStats.totalWorking}
        totalNotStarted={overallStats.totalNotStarted}
        overallPercent={overallStats.overallPercent}
        isLoading={isLoading}
        isConfigured={configured}
        projectId={SUPABASE_PROJECT_ID}
        user={user}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onSignOut={handleSignOut}
        onRefresh={() => fetchAllSystemsData(true)}
      />

      {/* Unconfigured Credentials Banner */}
      {!configured && (
        <div className="config-alert-banner">
          <div className="config-banner-inner">
            <div className="config-icon-box">
              <KeyRound size={22} />
            </div>
            <div className="config-text">
              <h4>Supabase Credentials Required</h4>
              <p>
                Please provide your Supabase connection variables in{' '}
                <code>src/lib/supabase.ts</code> or in your <code>.env</code> file.
              </p>
              <div className="config-code-preview">
                <span>1. SUPABASE_PROJECT_ID = 'your-project-id'</span>
                <span>2. SUPABASE_URL = 'https://your-project-id.supabase.co'</span>
                <span>3. SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_...' (Browser-safe publishable/anon key)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RLS Warning Banner */}
      {rlsWarning && (
        <div className="rls-warning-banner">
          <div className="rls-banner-inner">
            <ShieldAlert size={20} className="rls-icon" />
            <div className="rls-text">
              <strong>Row-Level Security Notice:</strong> {rlsWarning}
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <main className="app-main">
        {/* Left Sidebar: Pinned Dashboard + All child systems navigation */}
        <Sidebar
          systems={systems}
          activeSystemId={activeSystemId}
          onSelectSystem={(id) => setActiveSystemId(id)}
          statsMap={statsMap}
          overallStats={overallStats}
        />

        {/* Right Main Content: Switches between DashboardView and ChecklistView */}
        {activeSystemId === 'dashboard' ? (
          <DashboardView
            systems={systems}
            tasksBySystem={tasksBySystem}
            statsMap={statsMap}
            overallStats={overallStats}
            isLoading={isLoading}
            canEdit={Boolean(user)}
            onSelectSystem={(id) => setActiveSystemId(id)}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            onUpdateStatus={handleUpdateStatus}
          />
        ) : (
          <ChecklistView
            system={activeSystem}
            tasks={activeTasks}
            stats={
              statsMap[activeSystemId] || {
                total: 0,
                done: 0,
                working: 0,
                notStarted: 0,
                completionPercent: 0,
              }
            }
            isLoading={isLoading}
            canEdit={Boolean(user)}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            onUpdateStatus={handleUpdateStatus}
            onOpenCreateModal={() =>
              setTaskModalState({ isOpen: true, mode: 'create', task: null })
            }
            onOpenEditModal={(task) =>
              setTaskModalState({ isOpen: true, mode: 'edit', task })
            }
            onOpenDeleteModal={(task) =>
              setDeleteModalState({ isOpen: true, task })
            }
          />
        )}
      </main>

      {/* Modals */}
      <TaskModal
        isOpen={taskModalState.isOpen}
        mode={taskModalState.mode}
        initialTask={taskModalState.task}
        activeSystem={activeSystem}
        onClose={() => setTaskModalState({ isOpen: false, mode: 'create', task: null })}
        onSave={handleSaveTask}
      />

      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        task={deleteModalState.task}
        onClose={() => setDeleteModalState({ isOpen: false, task: null })}
        onConfirm={handleDeleteTask}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={(email) => addToast(`Welcome, ${email}!`, 'success')}
      />

      {/* Real-time Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
