import React from 'react';
import type { SystemInfo, SystemStats, OverallStats } from '../types';
import { SystemIcon } from './SystemIcon';
import {
  ChevronRight,
  CheckCircle2,
  ShieldCheck,
  ListOrdered,
  LayoutDashboard,
} from 'lucide-react';

interface SidebarProps {
  systems: SystemInfo[];
  activeSystemId: number | 'dashboard';
  onSelectSystem: (id: number | 'dashboard') => void;
  statsMap: Record<number, SystemStats>;
  overallStats: OverallStats;
}

export const Sidebar: React.FC<SidebarProps> = ({
  systems,
  activeSystemId,
  onSelectSystem,
  statsMap,
  overallStats,
}) => {
  return (
    <aside className="app-sidebar">
      {/* 1. Dashboard Overview Card (Pinned Above Child Systems) */}
      <div className="sidebar-dashboard-section">
        <button
          onClick={() => onSelectSystem('dashboard')}
          className={`system-nav-card dashboard-nav-card ${
            activeSystemId === 'dashboard' ? 'is-active' : ''
          }`}
          aria-label="Open Overall Project Dashboard"
        >
          <div className="card-top-row">
            <div className="system-icon-wrapper dashboard-icon-wrapper">
              <LayoutDashboard size={20} className="system-icon" />
            </div>
            <div className="system-identity">
              <div className="system-name-row">
                <span className="system-name">Dashboard</span>
                <span className="pulse-indicator-dot" title="Live System Telemetry" />
              </div>
              <span className="table-badge">Overall Statistics</span>
            </div>
            <ChevronRight
              size={16}
              className={`chevron-icon ${activeSystemId === 'dashboard' ? 'is-rotated' : ''}`}
            />
          </div>

          {/* Progress overview */}
          <div className="card-progress-section">
            <div className="progress-labels">
              <span className="task-count-text">
                {overallStats.totalTasks === 0
                  ? 'No features loaded'
                  : `${overallStats.totalDone} / ${overallStats.totalTasks} done`}
              </span>
              <span className="percentage-text">{overallStats.overallPercent}%</span>
            </div>
            <div className="system-progress-track">
              <div
                className="system-progress-fill dashboard-fill"
                style={{ width: `${overallStats.overallPercent}%` }}
              />
            </div>
          </div>

          {/* Sub-counts pills */}
          <div className="card-status-counts">
            <span className="mini-status done" title={`${overallStats.totalDone} completed`}>
              <CheckCircle2 size={11} /> {overallStats.totalDone}
            </span>
            <span className="mini-status working" title={`${overallStats.totalWorking} in progress`}>
              ● {overallStats.totalWorking}
            </span>
            <span className="mini-status not-started" title={`${overallStats.totalNotStarted} queued`}>
              ○ {overallStats.totalNotStarted}
            </span>
          </div>
        </button>
      </div>

      {/* 2. Child Systems Header */}
      <div className="sidebar-header">
        <div className="sidebar-title-row">
          <ListOrdered size={18} className="sidebar-header-icon" />
          <h2 className="sidebar-title">Child Systems</h2>
        </div>
        <span className="systems-count-badge">{systems.length} Tables</span>
      </div>

      <nav className="systems-nav-list" aria-label="System Checklist Navigation">
        {systems.map((sys) => {
          const isActive = sys.id === activeSystemId;
          const stats = statsMap[sys.id] || {
            total: 0,
            done: 0,
            working: 0,
            notStarted: 0,
            completionPercent: 0,
          };
          const isComplete = stats.total > 0 && stats.done === stats.total;

          return (
            <button
              key={sys.id}
              onClick={() => onSelectSystem(sys.id)}
              className={`system-nav-card ${isActive ? 'is-active' : ''}`}
            >
              <div className="card-top-row">
                <div className="system-icon-wrapper">
                  <SystemIcon name={sys.name} size={18} className="system-icon" />
                </div>
                <div className="system-identity">
                  <div className="system-name-row">
                    <span className="system-name">{sys.name}</span>
                    {isComplete && (
                      <span className="complete-indicator" title="All features completed!">
                        <ShieldCheck size={14} />
                      </span>
                    )}
                  </div>
                  <span className="table-badge">table: {sys.tableName}</span>
                </div>
                <ChevronRight
                  size={16}
                  className={`chevron-icon ${isActive ? 'is-rotated' : ''}`}
                />
              </div>

              {/* Progress overview */}
              <div className="card-progress-section">
                <div className="progress-labels">
                  <span className="task-count-text">
                    {stats.total === 0 ? 'No tasks yet' : `${stats.done} / ${stats.total} done`}
                  </span>
                  <span className="percentage-text">
                    {stats.completionPercent}%
                  </span>
                </div>
                <div className="system-progress-track">
                  <div
                    className="system-progress-fill"
                    style={{
                      width: `${stats.completionPercent}%`,
                      backgroundColor: isComplete ? 'var(--status-done)' : 'var(--primary)',
                    }}
                  />
                </div>
              </div>

              {/* Sub-counts pills */}
              {stats.total > 0 && (
                <div className="card-status-counts">
                  <span className="mini-status done" title={`${stats.done} done`}>
                    <CheckCircle2 size={11} /> {stats.done}
                  </span>
                  <span className="mini-status working" title={`${stats.working} working`}>
                    ● {stats.working}
                  </span>
                  <span className="mini-status not-started" title={`${stats.notStarted} not started`}>
                    ○ {stats.notStarted}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
