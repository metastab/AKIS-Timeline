import React, { useMemo } from 'react';
import type { SystemInfo, TaskItem, SystemStats, StatusType, OverallStats } from '../types';
import { SystemIcon } from './SystemIcon';
import {
  LayoutDashboard,
  CheckCircle2,
  Clock,
  CircleDashed,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Layers,
  Flame,
  ChevronRight,
  Database,
  Sparkles,
} from 'lucide-react';

interface DashboardViewProps {
  systems: SystemInfo[];
  tasksBySystem: Record<number, TaskItem[]>;
  statsMap: Record<number, SystemStats>;
  overallStats: OverallStats;
  isLoading: boolean;
  canEdit: boolean;
  onSelectSystem: (id: number) => void;
  onOpenLogin: () => void;
  onUpdateStatus: (taskId: number, newStatus: StatusType, systemId?: number) => Promise<void>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  systems,
  tasksBySystem,
  statsMap,
  overallStats,
  isLoading,
  canEdit,
  onSelectSystem,
  onOpenLogin,
  onUpdateStatus,
}) => {
  // Combine all tasks with system context
  const allTasksWithSystem = useMemo(() => {
    const list: Array<TaskItem & { systemName: string; tableName: string }> = [];
    systems.forEach((sys) => {
      const items = tasksBySystem[sys.id] || [];
      items.forEach((item) => {
        list.push({ ...item, systemName: sys.name, tableName: sys.tableName });
      });
    });
    return list;
  }, [systems, tasksBySystem]);

  // Priority matrix statistics
  const priorityStats = useMemo(() => {
    const high = allTasksWithSystem.filter((t) => t.priority === 'High');
    const med = allTasksWithSystem.filter((t) => t.priority === 'Medium');
    const low = allTasksWithSystem.filter((t) => t.priority === 'Low');

    const calcPercent = (done: number, total: number) =>
      total === 0 ? 0 : Math.round((done / total) * 100);

    const highDone = high.filter((t) => t.status === 'done').length;
    const medDone = med.filter((t) => t.status === 'done').length;
    const lowDone = low.filter((t) => t.status === 'done').length;

    return {
      high: {
        total: high.length,
        done: highDone,
        working: high.filter((t) => t.status === 'working').length,
        notStarted: high.filter((t) => t.status === 'not started').length,
        percent: calcPercent(highDone, high.length),
      },
      med: {
        total: med.length,
        done: medDone,
        working: med.filter((t) => t.status === 'working').length,
        notStarted: med.filter((t) => t.status === 'not started').length,
        percent: calcPercent(medDone, med.length),
      },
      low: {
        total: low.length,
        done: lowDone,
        working: low.filter((t) => t.status === 'working').length,
        notStarted: low.filter((t) => t.status === 'not started').length,
        percent: calcPercent(lowDone, low.length),
      },
    };
  }, [allTasksWithSystem]);

  // Active working tasks across all systems
  const activeWorkingTasks = useMemo(() => {
    return allTasksWithSystem.filter((t) => t.status === 'working');
  }, [allTasksWithSystem]);

  // High priority queued backlog tasks
  const highPriorityBacklog = useMemo(() => {
    return allTasksWithSystem.filter(
      (t) => t.priority === 'High' && t.status === 'not started'
    );
  }, [allTasksWithSystem]);

  if (isLoading && overallStats.totalTasks === 0) {
    return (
      <div className="dashboard-container animate-fade-in">
        <div className="panel-empty-dropzone" style={{ padding: '60px 20px', margin: '40px auto', maxWidth: 480 }}>
          <Database size={32} className="empty-zone-icon" />
          <p className="empty-zone-text">Loading Mission Control...</p>
          <span className="empty-zone-sub">Synchronizing 7 Supabase database tables</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container animate-fade-in">
      {/* =========================================================================
          SECTION 1: MISSION CONTROL BANNER & OVERALL PROJECT KPIS
          ========================================================================= */}
      <section className="dashboard-section section-kpis">
        <div className="dashboard-banner">
          <div className="banner-left">
            <div className="banner-icon-box dashboard-hero-icon">
              <LayoutDashboard size={30} />
            </div>
            <div className="banner-details">
              <div className="banner-title-line">
                <h2 className="section-title">Mission Control Dashboard</h2>
                <span className="table-name-tag pulse-badge">
                  <Database size={13} /> 7 Tables Synced
                </span>
              </div>
              <p className="banner-description">
                Overall project health, milestone completion & system cross-cutting telemetry.
              </p>
            </div>
          </div>

          <div className="banner-stats-widget dashboard-overall-widget">
            <div className="widget-top">
              <span className="widget-label">OVERALL COMPLETION:  </span>
              <span className="widget-percent">{overallStats.overallPercent}%</span>
            </div>
            <div className="widget-bar-track">
              <div
                className="widget-bar-fill"
                style={{ width: `${overallStats.overallPercent}%` }}
              />
            </div>
            <div className="widget-sub-counts">
              <span>{overallStats.totalDone} done</span>
              <span> • </span>
              <span>{overallStats.totalWorking} working</span>
              <span> • </span>
              <span>{overallStats.totalNotStarted} queued</span>
            </div>
          </div>
        </div>

        {/* 4 Big KPI Metric Tiles */}
        <div className="kpi-grid">
          <div className="kpi-card total">
            <div className="kpi-header">
              <span className="kpi-title">TOTAL FEATURES</span>
              <Layers size={18} className="kpi-icon total" />
            </div>
            <div className="kpi-value">{overallStats.totalTasks}</div>
            <div className="kpi-meta">
              <span>Spread across {systems.length} subsystems</span>
            </div>
          </div>

          <div className="kpi-card done">
            <div className="kpi-header">
              <span className="kpi-title">COMPLETED</span>
              <CheckCircle2 size={18} className="kpi-icon done" />
            </div>
            <div className="kpi-value done-text">{overallStats.totalDone}</div>
            <div className="kpi-meta">
              <span className="badge-highlight done-badge">
                {overallStats.overallPercent}% delivered
              </span>
            </div>
          </div>

          <div className="kpi-card working">
            <div className="kpi-header">
              <span className="kpi-title">IN PROGRESS</span>
              <Clock size={18} className="kpi-icon working" />
            </div>
            <div className="kpi-value working-text">{overallStats.totalWorking}</div>
            <div className="kpi-meta">
              <span>Active in development</span>
            </div>
          </div>

          <div className="kpi-card queued">
            <div className="kpi-header">
              <span className="kpi-title">NOT STARTED</span>
              <CircleDashed size={18} className="kpi-icon queued" />
            </div>
            <div className="kpi-value queued-text">{overallStats.totalNotStarted}</div>
            <div className="kpi-meta">
              <span>Waiting in pipeline</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: SUBSYSTEM PROGRESS BREAKDOWN (ALL 7 CHILD SYSTEMS)
          ========================================================================= */}
      <section className="dashboard-section">
        <div className="section-header-row">
          <div className="section-heading-group">
            <h3 className="dashboard-section-heading">
              <Layers size={18} className="heading-icon" /> Subsystem Progress Breakdown
            </h3>
            <p className="dashboard-section-sub">
              Direct access to all 7 game architecture systems. Click any card to inspect its Kanban board.
            </p>
          </div>
          <span className="section-pill-count">{systems.length} Subsystems</span>
        </div>

        <div className="systems-dashboard-grid">
          {systems.map((sys) => {
            const stats = statsMap[sys.id] || {
              total: 0,
              done: 0,
              working: 0,
              notStarted: 0,
              completionPercent: 0,
            };
            const isComplete = stats.total > 0 && stats.done === stats.total;

            return (
              <div
                key={sys.id}
                className={`subsystem-card ${isComplete ? 'is-complete' : ''}`}
                onClick={() => onSelectSystem(sys.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelectSystem(sys.id);
                  }
                }}
              >
                <div className="subsystem-card-top">
                  <div className="subsystem-title-box">
                    <div className="subsystem-icon-box">
                      <SystemIcon name={sys.name} size={20} />
                    </div>
                    <div>
                      <h4 className="subsystem-name">{sys.name}</h4>
                      <span className="subsystem-table-tag">table: {sys.tableName}</span>
                    </div>
                  </div>
                  <div className="subsystem-percent-badge">
                    {stats.completionPercent}%
                  </div>
                </div>

                <p className="subsystem-description">{sys.description}</p>

                {/* Progress Bar */}
                <div className="subsystem-progress-container">
                  <div className="subsystem-progress-track">
                    <div
                      className={`subsystem-progress-fill ${isComplete ? 'complete-fill' : ''}`}
                      style={{ width: `${stats.completionPercent}%` }}
                    />
                  </div>
                </div>

                {/* Stats Breakdown Pills & Action Button */}
                <div className="subsystem-card-footer">
                  <div className="subsystem-pill-group">
                    <span className="sub-pill done" title={`${stats.done} done`}>
                      <CheckCircle2 size={11} /> {stats.done}
                    </span>
                    <span className="sub-pill working" title={`${stats.working} working`}>
                      ● {stats.working}
                    </span>
                    <span className="sub-pill notstarted" title={`${stats.notStarted} queued`}>
                      ○ {stats.notStarted}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="open-system-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSystem(sys.id);
                    }}
                    title={`Open ${sys.name} Kanban board`}
                  >
                    <span>Inspect</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: PRIORITY MATRIX (CROSS-SYSTEM DISTRIBUTION)
          ========================================================================= */}
      <section className="dashboard-section">
        <div className="section-header-row">
          <div className="section-heading-group">
            <h3 className="dashboard-section-heading">
              <TrendingUp size={18} className="heading-icon" /> Priority Matrix & Workload
            </h3>
            <p className="dashboard-section-sub">
              Cross-cutting distribution of feature priority across the entire codebase.
            </p>
          </div>
        </div>

        {/* Priority Stacked Ratio Bar */}
        <div className="priority-ratio-card">
          <div className="ratio-bar-header">
            <span className="ratio-bar-title">Priority Ratio (Total: {overallStats.totalTasks})</span>
            <div className="ratio-legend">
              <span className="legend-item high">
                <span className="legend-dot high" /> High: {priorityStats.high.total}
              </span>
              <span className="legend-item med">
                <span className="legend-dot med" /> Medium: {priorityStats.med.total}
              </span>
              <span className="legend-item low">
                <span className="legend-dot low" /> Low: {priorityStats.low.total}
              </span>
            </div>
          </div>

          <div className="ratio-stacked-bar">
            {overallStats.totalTasks > 0 && (
              <>
                <div
                  className="ratio-segment high"
                  style={{
                    width: `${(priorityStats.high.total / overallStats.totalTasks) * 100}%`,
                  }}
                  title={`High: ${priorityStats.high.total} features`}
                />
                <div
                  className="ratio-segment med"
                  style={{
                    width: `${(priorityStats.med.total / overallStats.totalTasks) * 100}%`,
                  }}
                  title={`Medium: ${priorityStats.med.total} features`}
                />
                <div
                  className="ratio-segment low"
                  style={{
                    width: `${(priorityStats.low.total / overallStats.totalTasks) * 100}%`,
                  }}
                  title={`Low: ${priorityStats.low.total} features`}
                />
              </>
            )}
          </div>
        </div>

        {/* 3 Detail Cards for High, Medium, Low */}
        <div className="priority-cards-grid">
          {/* HIGH PRIORITY */}
          <div className="priority-tier-card high-tier">
            <div className="tier-header">
              <div className="tier-title-row">
                <span className="tier-badge high">HIGH PRIORITY</span>
                <Flame size={16} className="tier-icon high" />
              </div>
              <span className="tier-total-count">{priorityStats.high.total} items</span>
            </div>
            <div className="tier-metric-line">
              <div className="tier-percent">{priorityStats.high.percent}%</div>
              <div className="tier-completion-text">resolved</div>
            </div>
            <div className="subsystem-progress-track">
              <div
                className="subsystem-progress-fill tier-fill-high"
                style={{ width: `${priorityStats.high.percent}%` }}
              />
            </div>
            <div className="tier-breakdown">
              <span><strong>{priorityStats.high.done}</strong> done</span>
              <span><strong>{priorityStats.high.working}</strong> working</span>
              <span><strong>{priorityStats.high.notStarted}</strong> queued</span>
            </div>
          </div>

          {/* MEDIUM PRIORITY */}
          <div className="priority-tier-card med-tier">
            <div className="tier-header">
              <div className="tier-title-row">
                <span className="tier-badge med">MEDIUM PRIORITY</span>
                <Sparkles size={16} className="tier-icon med" />
              </div>
              <span className="tier-total-count">{priorityStats.med.total} items</span>
            </div>
            <div className="tier-metric-line">
              <div className="tier-percent">{priorityStats.med.percent}%</div>
              <div className="tier-completion-text">resolved</div>
            </div>
            <div className="subsystem-progress-track">
              <div
                className="subsystem-progress-fill tier-fill-med"
                style={{ width: `${priorityStats.med.percent}%` }}
              />
            </div>
            <div className="tier-breakdown">
              <span><strong>{priorityStats.med.done}</strong> done</span>
              <span><strong>{priorityStats.med.working}</strong> working</span>
              <span><strong>{priorityStats.med.notStarted}</strong> queued</span>
            </div>
          </div>

          {/* LOW PRIORITY */}
          <div className="priority-tier-card low-tier">
            <div className="tier-header">
              <div className="tier-title-row">
                <span className="tier-badge low">LOW PRIORITY</span>
                <CircleDashed size={16} className="tier-icon low" />
              </div>
              <span className="tier-total-count">{priorityStats.low.total} items</span>
            </div>
            <div className="tier-metric-line">
              <div className="tier-percent">{priorityStats.low.percent}%</div>
              <div className="tier-completion-text">resolved</div>
            </div>
            <div className="subsystem-progress-track">
              <div
                className="subsystem-progress-fill tier-fill-low"
                style={{ width: `${priorityStats.low.percent}%` }}
              />
            </div>
            <div className="tier-breakdown">
              <span><strong>{priorityStats.low.done}</strong> done</span>
              <span><strong>{priorityStats.low.working}</strong> working</span>
              <span><strong>{priorityStats.low.notStarted}</strong> queued</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: HIGH PRIORITY & WORKING TASKS SPOTLIGHT
          ========================================================================= */}
      <section className="dashboard-section">
        <div className="section-header-row">
          <div className="section-heading-group">
            <h3 className="dashboard-section-heading">
              <Flame size={18} className="heading-icon" /> Mission Critical Spotlight
            </h3>
            <p className="dashboard-section-sub">
              Active engineering items in flight and high-priority queued features across systems.
            </p>
          </div>
        </div>

        <div className="spotlight-columns-grid">
          {/* COLUMN A: CURRENTLY WORKING */}
          <div className="spotlight-column working-column">
            <div className="spotlight-col-header">
              <div className="col-header-left">
                <Clock size={16} className="col-icon working" />
                <h4>In Progress ({activeWorkingTasks.length})</h4>
              </div>
              <span className="spotlight-col-badge working">Active</span>
            </div>

            <div className="spotlight-card-list">
              {activeWorkingTasks.length === 0 ? (
                <div className="spotlight-empty-state">
                  <Clock size={24} className="empty-icon" />
                  <p className="empty-primary">No tasks in active progress</p>
                  <p className="empty-sub">
                    Pick any high-priority item from the right column to start working.
                  </p>
                </div>
              ) : (
                activeWorkingTasks.map((t) => (
                  <div key={`${t.system_id}-${t.id}`} className="spotlight-task-card working">
                    <div className="spotlight-card-top">
                      <div className="spotlight-system-tag">
                        <SystemIcon name={t.systemName} size={12} />
                        <span>{t.systemName}</span>
                      </div>
                      <span className={`priority-tag ${t.priority.toLowerCase()}`}>
                        {t.priority}
                      </span>
                    </div>

                    <h5 className="spotlight-task-title">{t.feature}</h5>
                    {t.description && (
                      <p className="spotlight-task-desc">{t.description}</p>
                    )}

                    <div className="spotlight-card-actions">
                      <button
                        className="spotlight-action-btn jump"
                        onClick={() => onSelectSystem(t.system_id)}
                      >
                        <span>Open in {t.systemName}</span>
                        <ArrowRight size={12} />
                      </button>

                      {canEdit ? (
                        <button
                          className="spotlight-action-btn mark-done"
                          onClick={() => onUpdateStatus(t.id, 'done', t.system_id)}
                        >
                          <CheckCircle2 size={12} />
                          <span>Mark Done</span>
                        </button>
                      ) : (
                        <button
                          className="spotlight-action-btn locked"
                          onClick={onOpenLogin}
                        >
                          <span>Sign In to Edit</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COLUMN B: CRITICAL HIGH PRIORITY QUEUE */}
          <div className="spotlight-column high-queue-column">
            <div className="spotlight-col-header">
              <div className="col-header-left">
                <AlertTriangle size={16} className="col-icon high" />
                <h4>High Priority Queued ({highPriorityBacklog.length})</h4>
              </div>
              <span className="spotlight-col-badge high">Urgent</span>
            </div>

            <div className="spotlight-card-list">
              {highPriorityBacklog.length === 0 ? (
                <div className="spotlight-empty-state">
                  <CheckCircle2 size={24} className="empty-icon" />
                  <p className="empty-primary">All High Priority features completed!</p>
                  <p className="empty-sub">
                    No critical backlog features are waiting in the queue.
                  </p>
                </div>
              ) : (
                highPriorityBacklog.slice(0, 8).map((t) => (
                  <div key={`${t.system_id}-${t.id}`} className="spotlight-task-card high-backlog">
                    <div className="spotlight-card-top">
                      <div className="spotlight-system-tag">
                        <SystemIcon name={t.systemName} size={12} />
                        <span>{t.systemName}</span>
                      </div>
                      <span className="task-id-tag">#{t.id}</span>
                    </div>

                    <h5 className="spotlight-task-title">{t.feature}</h5>
                    {t.description && (
                      <p className="spotlight-task-desc">{t.description}</p>
                    )}

                    <div className="spotlight-card-actions">
                      <button
                        className="spotlight-action-btn jump"
                        onClick={() => onSelectSystem(t.system_id)}
                      >
                        <span>Inspect Board</span>
                        <ArrowRight size={12} />
                      </button>

                      {canEdit ? (
                        <button
                          className="spotlight-action-btn start-working"
                          onClick={() => onUpdateStatus(t.id, 'working', t.system_id)}
                        >
                          <Clock size={12} />
                          <span>Start Working</span>
                        </button>
                      ) : (
                        <button
                          className="spotlight-action-btn locked"
                          onClick={onOpenLogin}
                        >
                          <span>Sign In to Start</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
