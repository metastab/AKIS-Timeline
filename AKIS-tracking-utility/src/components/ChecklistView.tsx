import React, { useState, useMemo } from 'react';
import type { TaskItem, SystemInfo, StatusType, PriorityType, SystemStats } from '../types';
import { SystemIcon } from './SystemIcon';
import {
  CheckCircle2,
  Clock,
  CircleDashed,
  Plus,
  Search,
  Edit3,
  Trash2,
  Sparkles,
  ArrowUpDown,
  XCircle,
  Database,
  Filter,
  Lock,
  ShieldCheck,
  GripVertical,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
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
  const [priorityFilter, setPriorityFilter] = useState<'all' | PriorityType>('all');
  const [sortBy, setSortBy] = useState<'id' | 'priority' | 'feature'>('id');

  // Drag and Drop state
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<StatusType | null>(null);

  // Filter tasks based on search and priority
  const processedTasks = useMemo(() => {
    let result = [...tasks];

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
      return 0;
    });

    return result;
  }, [tasks, priorityFilter, searchQuery, sortBy]);

  // Group tasks into the 3 panels (case-insensitive for resilience)
  const notStartedTasks = useMemo(
    () => processedTasks.filter((t) => {
      const s = t.status?.toLowerCase().trim();
      return s === 'not started' || (!s || (s !== 'working' && s !== 'done' && s !== 'completed'));
    }),
    [processedTasks]
  );
  const workingTasks = useMemo(
    () => processedTasks.filter((t) => {
      const s = t.status?.toLowerCase().trim();
      return s === 'working' || s === 'in progress' || s === 'in_progress';
    }),
    [processedTasks]
  );
  const doneTasks = useMemo(
    () => processedTasks.filter((t) => {
      const s = t.status?.toLowerCase().trim();
      return s === 'done' || s === 'completed';
    }),
    [processedTasks]
  );

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, task: TaskItem) => {
    if (!canEdit) {
      e.preventDefault();
      onOpenLogin();
      return;
    }
    setDraggedTaskId(task.id);
    e.dataTransfer.setData('text/plain', String(task.id));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnStatus: StatusType) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = canEdit ? 'move' : 'none';
    if (dragOverColumn !== columnStatus) {
      setDragOverColumn(columnStatus);
    }
  };

  const handleDragLeave = (e: React.DragEvent, columnStatus: StatusType) => {
    // Only clear if leaving the drop container itself
    const relatedTarget = e.relatedTarget as Node | null;
    if (relatedTarget && (e.currentTarget as Node).contains(relatedTarget)) {
      return;
    }
    if (dragOverColumn === columnStatus) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: StatusType) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!canEdit) {
      onOpenLogin();
      return;
    }

    const taskIdStr = e.dataTransfer.getData('text/plain');
    const taskId = Number(taskIdStr) || draggedTaskId;

    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== targetStatus) {
      onUpdateStatus(task.id, targetStatus);
    }
    setDraggedTaskId(null);
  };

  // Quick Move helper for 1-click movement
  const handleQuickMove = (task: TaskItem, newStatus: StatusType) => {
    if (!canEdit) {
      onOpenLogin();
      return;
    }
    onUpdateStatus(task.id, newStatus);
  };

  // Render a single task card
  const renderTaskCard = (task: TaskItem) => {
    const isDragging = draggedTaskId === task.id;
    const s = task.status?.toLowerCase().trim() || 'not started';
    const isDone = s === 'done' || s === 'completed';
    const isWorking = s === 'working' || s === 'in progress' || s === 'in_progress';
    const isNotStarted = !isDone && !isWorking;
    const statusClass = isDone ? 'done' : isWorking ? 'working' : 'not-started';

    return (
      <div
        key={task.id}
        draggable={canEdit}
        onDragStart={(e) => handleDragStart(e, task)}
        onDragEnd={handleDragEnd}
        className={`kanban-card ${statusClass} ${isDragging ? 'is-dragging' : ''} ${
          !canEdit ? 'is-readonly' : ''
        }`}
      >
        {/* Card Header: Drag Grip, Priority, ID, and Action buttons */}
        <div className="card-top-bar">
          <div className="card-meta-left">
            <span
              className={`drag-handle ${canEdit ? 'can-drag' : 'locked'}`}
              title={canEdit ? 'Drag to move between columns' : 'Sign in to drag and edit'}
            >
              <GripVertical size={14} />
            </span>
            <span className={`priority-tag ${task.priority.toLowerCase()}`}>
              {task.priority}
            </span>
            <span className="task-id-tag">#{task.id}</span>
          </div>

          {canEdit && (
            <div className="card-actions-quick">
              <button
                onClick={() => onOpenEditModal(task)}
                className="card-action-btn edit"
                title="Edit feature"
                aria-label={`Edit ${task.feature}`}
              >
                <Edit3 size={14} />
              </button>
              <button
                onClick={() => onOpenDeleteModal(task)}
                className="card-action-btn delete"
                title="Delete feature"
                aria-label={`Delete ${task.feature}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Card Body: Feature Name & Description */}
        <div className="card-body">
          <h4 className={`card-feature-title ${isDone ? 'is-done-text' : ''}`}>
            {task.feature}
          </h4>
          {task.description && (
            <p className={`card-description ${isDone ? 'is-done-desc' : ''}`}>
              {task.description}
            </p>
          )}
        </div>

        {/* Card Footer: Quick Move Controls */}
        <div className="card-footer-controls">
          {isNotStarted && (
            <button
              onClick={() => handleQuickMove(task, 'working')}
              className="quick-move-btn to-working"
              title={canEdit ? 'Move to Working' : 'Sign in to update'}
            >
              <span>Start Working</span>
              <ArrowRight size={13} />
            </button>
          )}

          {isWorking && (
            <div className="working-controls-row">
              <button
                onClick={() => handleQuickMove(task, 'not started')}
                className="quick-move-btn to-notstarted"
                title={canEdit ? 'Move back to Not Started' : 'Sign in to update'}
              >
                <ArrowLeft size={13} />
                <span>Queue</span>
              </button>
              <button
                onClick={() => handleQuickMove(task, 'done')}
                className="quick-move-btn to-done"
                title={canEdit ? 'Mark as Done' : 'Sign in to update'}
              >
                <span>Done</span>
                <CheckCircle2 size={13} />
              </button>
            </div>
          )}

          {isDone && (
            <button
              onClick={() => handleQuickMove(task, 'working')}
              className="quick-move-btn to-working-reopen"
              title={canEdit ? 'Reopen into Working' : 'Sign in to update'}
            >
              <RotateCcw size={12} />
              <span>Reopen</span>
            </button>
          )}
        </div>
      </div>
    );
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
              <span>{stats.done} done</span>
              <span>•</span>
              <span>{stats.working} working</span>
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
              <option value="priority">Priority (High first)</option>
              <option value="feature">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Drag and Drop instructions tag */}
        <div className="dnd-hint-badge">
          <GripVertical size={13} />
          <span>Drag & Drop cards between panels to change status</span>
        </div>
      </div>

      {/* 3 SEPARATE PANELS: NOT STARTED, WORKING, DONE */}
      <div className="checklist-items-area">
        {isLoading ? (
          <div className="checklist-loading-state">
            <div className="spinner-large" />
            <p>Loading features for {system.name} from Supabase...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="checklist-empty-state">
            <div className="empty-icon-wrap">
              <Sparkles size={32} />
            </div>
            <h3>No features in {system.name} system yet</h3>
            <p>Start populating the checklist for table <code>{system.tableName}</code>.</p>
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
          </div>
        ) : (
          <div className="kanban-board">
            {/* PANEL 1: NOT STARTED */}
            <div
              className={`kanban-panel panel-not-started ${
                dragOverColumn === 'not started' ? 'is-drag-over' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, 'not started')}
              onDragLeave={(e) => handleDragLeave(e, 'not started')}
              onDrop={(e) => handleDrop(e, 'not started')}
            >
              {/* Panel Header */}
              <div className="kanban-panel-header">
                <div className="panel-header-title">
                  <div className="panel-status-icon not-started">
                    <CircleDashed size={16} />
                  </div>
                  <h3>NOT STARTED</h3>
                </div>
                <div className="panel-header-count">
                  <span>{notStartedTasks.length}</span>
                </div>
              </div>

              {/* Drop Target & Card List */}
              <div className="kanban-panel-content">
                {notStartedTasks.length === 0 ? (
                  <div className="panel-empty-dropzone">
                    <CircleDashed size={24} className="empty-zone-icon" />
                    <p className="empty-zone-text">No queued tasks</p>
                    <span className="empty-zone-sub">Drop cards here to queue</span>
                  </div>
                ) : (
                  <div className="cards-stack">
                    {notStartedTasks.map((t) => renderTaskCard(t))}
                  </div>
                )}
              </div>
            </div>

            {/* PANEL 2: WORKING */}
            <div
              className={`kanban-panel panel-working ${
                dragOverColumn === 'working' ? 'is-drag-over' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, 'working')}
              onDragLeave={(e) => handleDragLeave(e, 'working')}
              onDrop={(e) => handleDrop(e, 'working')}
            >
              {/* Panel Header */}
              <div className="kanban-panel-header">
                <div className="panel-header-title">
                  <div className="panel-status-icon working">
                    <Clock size={16} />
                  </div>
                  <h3>WORKING</h3>
                </div>
                <div className="panel-header-count">
                  <span>{workingTasks.length}</span>
                </div>
              </div>

              {/* Drop Target & Card List */}
              <div className="kanban-panel-content">
                {workingTasks.length === 0 ? (
                  <div className="panel-empty-dropzone">
                    <Clock size={24} className="empty-zone-icon" />
                    <p className="empty-zone-text">No active tasks</p>
                    <span className="empty-zone-sub">Drop cards here to start</span>
                  </div>
                ) : (
                  <div className="cards-stack">
                    {workingTasks.map((t) => renderTaskCard(t))}
                  </div>
                )}
              </div>
            </div>

            {/* PANEL 3: DONE */}
            <div
              className={`kanban-panel panel-done ${
                dragOverColumn === 'done' ? 'is-drag-over' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, 'done')}
              onDragLeave={(e) => handleDragLeave(e, 'done')}
              onDrop={(e) => handleDrop(e, 'done')}
            >
              {/* Panel Header */}
              <div className="kanban-panel-header">
                <div className="panel-header-title">
                  <div className="panel-status-icon done">
                    <CheckCircle2 size={16} />
                  </div>
                  <h3>DONE</h3>
                </div>
                <div className="panel-header-count">
                  <span>{doneTasks.length}</span>
                </div>
              </div>

              {/* Drop Target & Card List */}
              <div className="kanban-panel-content">
                {doneTasks.length === 0 ? (
                  <div className="panel-empty-dropzone">
                    <CheckCircle2 size={24} className="empty-zone-icon" />
                    <p className="empty-zone-text">No completed tasks</p>
                    <span className="empty-zone-sub">Drop cards here when finished</span>
                  </div>
                ) : (
                  <div className="cards-stack">
                    {doneTasks.map((t) => renderTaskCard(t))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
