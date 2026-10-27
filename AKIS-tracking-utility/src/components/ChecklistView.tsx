import React, { useState, useMemo } from 'react';
import type { TaskItem, SystemInfo, StatusType, PriorityType, SystemStats } from '../types';
import { SystemIcon } from './SystemIcon';
import {
  CheckCircle2,
  Clock,
  CircleDashed,
  Plus,
  Search,
  SlidersHorizontal,
  Edit3,
  Trash2,
  Sparkles,
  ArrowUpDown,
  XCircle,
  Database,
  Filter,
  Lock,
  ShieldCheck,
} from 'lucide-react';

interface ChecklistViewProps {
  system: SystemInfo;
  tasks: TaskItem[];
  stats: SystemStats;
  isLoading: boolean;
  canEdit: boolean;
  onOpenLogin: () => void;
  onUpdateStatus: (taskId: number, newStatus: StatusType) => Promise<void>;
  onOpenCreateModal: () => void;
  onOpenEditModal: (task: TaskItem) => void;
  onOpenDeleteModal: (task: TaskItem) => void;
}

export const ChecklistView: React.FC<ChecklistViewProps> = ({
  system,
  tasks,
  stats,
  isLoading,
  canEdit,
  onOpenLogin,
  onUpdateStatus,
  onOpenCreateModal,
  onOpenEditModal,
  onOpenDeleteModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StatusType>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | PriorityType>('all');
  const [sortBy, setSortBy] = useState<'id' | 'priority' | 'feature' | 'status'>('id');

  // Filter & sort logic
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.feature.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'id') {
        return a.id - b.id;
      }
      if (sortBy === 'feature') {
        return a.feature.localeCompare(b.feature);
      }
      if (sortBy === 'priority') {
        const order: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
        return (order[b.priority] || 0) - (order[a.priority] || 0);
      }
      if (sortBy === 'status') {
        const order: Record<string, number> = { done: 3, working: 2, 'not started': 1 };
        return (order[b.status] || 0) - (order[a.status] || 0);
      }
      return 0;
    });

    return result;
  }, [tasks, statusFilter, priorityFilter, searchQuery, sortBy]);

  // Cycle status on checkbox click
  const handleCycleStatus = (task: TaskItem) => {
    if (!canEdit) {
      onOpenLogin();
      return;
    }
    let nextStatus: StatusType = 'working';
    if (task.status === 'not started') nextStatus = 'working';
    else if (task.status === 'working') nextStatus = 'done';
    else if (task.status === 'done') nextStatus = 'not started';

    onUpdateStatus(task.id, nextStatus);
  };

  return (
    <section className="checklist-container">
      {/* Top Banner for active system */}
      <div className="section-banner">
        <div className="banner-left">
          <div className="banner-icon-box">
            <SystemIcon name={system.name} size={28} className="banner-icon" />
          </div>
          <div className="banner-details">
            <div className="banner-title-line">
              <h2 className="section-title">{system.name} System</h2>
              <span className="table-name-tag">
                <Database size={13} /> {system.tableName}
              </span>
              <span className={`mode-badge ${canEdit ? 'editor' : 'readonly'}`}>
                {canEdit ? (
                  <>
                    <ShieldCheck size={12} /> Team Editor
                  </>
                ) : (
                  <>
                    <Lock size={12} /> Read-Only
                  </>
                )}
              </span>
            </div>
            <p className="section-desc">{system.description}</p>
          </div>
        </div>

        <div className="banner-right">
          {/* Progress gauge */}
          <div className="banner-progress-box">
            <div className="progress-stat-header">
              <span className="progress-stat-label">System Progress</span>
              <span className="progress-stat-percent">{stats.completionPercent}%</span>
            </div>
            <div className="banner-progress-bar">
              <div
                className="banner-progress-fill"
                style={{ width: `${stats.completionPercent}%` }}
              />
            </div>
            <div className="banner-mini-stats">
              <span>{stats.done} completed</span>
              <span>•</span>
              <span>{stats.working} in progress</span>
              <span>•</span>
              <span>{stats.notStarted} queued</span>
            </div>
          </div>

          {canEdit ? (
            <button
              onClick={onOpenCreateModal}
              className="btn-create-task"
              title={`Add new task to ${system.name}`}
            >
              <Plus size={18} />
              <span>New Feature</span>
            </button>
          ) : (
            <button
              onClick={onOpenLogin}
              className="btn-create-task is-locked"
              title="Team sign in required to add features"
            >
              <Lock size={16} />
              <span>Sign In to Add</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and controls toolbar */}
      <div className="controls-toolbar">
        {/* Search */}
        <div className="search-bar-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder={`Search ${system.name} features or descriptions...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="search-clear-btn"
              title="Clear search"
            >
              <XCircle size={15} />
            </button>
          )}
        </div>

        {/* Status filter tabs */}
        <div className="filter-tabs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`filter-tab-btn ${statusFilter === 'all' ? 'is-active' : ''}`}
          >
            All <span className="tab-count">{tasks.length}</span>
          </button>
          <button
            onClick={() => setStatusFilter('done')}
            className={`filter-tab-btn done ${statusFilter === 'done' ? 'is-active' : ''}`}
          >
            <CheckCircle2 size={13} />
            Done <span className="tab-count">{stats.done}</span>
          </button>
          <button
            onClick={() => setStatusFilter('working')}
            className={`filter-tab-btn working ${statusFilter === 'working' ? 'is-active' : ''}`}
          >
            <Clock size={13} />
            Working <span className="tab-count">{stats.working}</span>
          </button>
          <button
            onClick={() => setStatusFilter('not started')}
            className={`filter-tab-btn not-started ${
              statusFilter === 'not started' ? 'is-active' : ''
            }`}
          >
            <CircleDashed size={13} />
            Not Started <span className="tab-count">{stats.notStarted}</span>
          </button>
        </div>

        {/* Priority and Sort selectors */}
        <div className="dropdowns-group">
          <div className="select-wrapper">
            <Filter size={14} className="select-icon" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="toolbar-select"
              aria-label="Filter by priority"
            >
              <option value="all">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>

          <div className="select-wrapper">
            <ArrowUpDown size={14} className="select-icon" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="toolbar-select"
              aria-label="Sort checklist"
            >
              <option value="id">Default (ID)</option>
              <option value="priority">Priority (High to Low)</option>
              <option value="status">Status (Done first)</option>
              <option value="feature">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Checklist items list */}
      <div className="checklist-items-area">
        {isLoading ? (
          <div className="checklist-loading-state">
            <div className="spinner-large" />
            <p>Loading features for {system.name} from Supabase...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="checklist-empty-state">
            {tasks.length === 0 ? (
              <>
                <div className="empty-icon-wrap">
                  <Sparkles size={32} />
                </div>
                <h3>No features in {system.name} system yet</h3>
                <p>
                  Start populating the checklist for table <code>{system.tableName}</code>.
                </p>
                {canEdit ? (
                  <button onClick={onOpenCreateModal} className="btn-primary">
                    <Plus size={16} />
                    <span>Add First Feature</span>
                  </button>
                ) : (
                  <button onClick={onOpenLogin} className="btn-secondary">
                    <Lock size={15} />
                    <span>Team Sign In to Add Features</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="empty-icon-wrap">
                  <SlidersHorizontal size={28} />
                </div>
                <h3>No matching features</h3>
                <p>No features match your current search and filter settings.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setPriorityFilter('all');
                  }}
                  className="btn-secondary"
                >
                  Clear Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="items-list">
            {filteredTasks.map((task) => {
              const isDone = task.status === 'done';
              const isWorking = task.status === 'working';
              const isNotStarted = task.status === 'not started';

              return (
                <div
                  key={task.id}
                  className={`task-row ${task.status} animate-fade-in`}
                >
                  {/* Left: Quick Cycle Status Button */}
                  <button
                    onClick={() => handleCycleStatus(task)}
                    className={`status-cycle-btn ${task.status} ${!canEdit ? 'readonly' : ''}`}
                    title={canEdit ? `Current: ${task.status}. Click to cycle status.` : `Current: ${task.status}. Sign in to edit.`}
                    aria-label={`Cycle status for ${task.feature}`}
                  >
                    {isDone && <CheckCircle2 size={20} className="cycle-icon-done" />}
                    {isWorking && <Clock size={20} className="cycle-icon-working" />}
                    {isNotStarted && <CircleDashed size={20} className="cycle-icon-notstarted" />}
                  </button>

                  {/* Center: Details */}
                  <div className="task-content">
                    <div className="task-header-line">
                      <h4 className={`task-feature-title ${isDone ? 'is-done-text' : ''}`}>
                        {task.feature}
                      </h4>

                      <div className="task-badges">
                        <span className={`priority-tag ${task.priority.toLowerCase()}`}>
                          {task.priority}
                        </span>
                        <span className="task-id-tag">#{task.id}</span>
                      </div>
                    </div>

                    {task.description && (
                      <p className={`task-description ${isDone ? 'is-done-desc' : ''}`}>
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Right: Direct 3-way status pills & Actions */}
                  <div className="task-actions-group">
                    {/* 1-click status switcher pills */}
                    <div className="status-pill-group" role="group" aria-label="Set task status">
                      <button
                        onClick={() => canEdit ? onUpdateStatus(task.id, 'not started') : onOpenLogin()}
                        className={`status-pill not-started ${isNotStarted ? 'active' : ''} ${!canEdit ? 'readonly' : ''}`}
                        title={canEdit ? "Mark as Not Started" : "Sign in to update status"}
                      >
                        <CircleDashed size={12} />
                        <span>Not Started</span>
                      </button>
                      <button
                        onClick={() => canEdit ? onUpdateStatus(task.id, 'working') : onOpenLogin()}
                        className={`status-pill working ${isWorking ? 'active' : ''} ${!canEdit ? 'readonly' : ''}`}
                        title={canEdit ? "Mark as Working / In Progress" : "Sign in to update status"}
                      >
                        <Clock size={12} />
                        <span>Working</span>
                      </button>
                      <button
                        onClick={() => canEdit ? onUpdateStatus(task.id, 'done') : onOpenLogin()}
                        className={`status-pill done ${isDone ? 'active' : ''} ${!canEdit ? 'readonly' : ''}`}
                        title={canEdit ? "Mark as Done" : "Sign in to update status"}
                      >
                        <CheckCircle2 size={12} />
                        <span>Done</span>
                      </button>
                    </div>

                    {/* Edit and Delete action buttons (only rendered when logged in) */}
                    {canEdit && (
                      <div className="edit-delete-group animate-fade-in">
                        <button
                          onClick={() => onOpenEditModal(task)}
                          className="action-icon-btn edit-btn"
                          title="Edit feature"
                          aria-label="Edit feature"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => onOpenDeleteModal(task)}
                          className="action-icon-btn delete-btn"
                          title="Delete feature"
                          aria-label="Delete feature"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
