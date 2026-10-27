import React, { useState, useEffect } from 'react';
import type { TaskItem, PriorityType, StatusType, SystemInfo } from '../types';
import { X, Plus, Save, AlertCircle, CheckCircle2, Clock, CircleDashed } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialTask?: TaskItem | null;
  activeSystem: SystemInfo;
  onClose: () => void;
  onSave: (taskData: {
    feature: string;
    description: string;
    priority: PriorityType;
    status: StatusType;
  }) => Promise<void>;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  mode,
  initialTask,
  activeSystem,
  onClose,
  onSave,
}) => {
  const [feature, setFeature] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<PriorityType>('Medium');
  const [status, setStatus] = useState<StatusType>('not started');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTask && mode === 'edit') {
      setFeature(initialTask.feature);
      setDescription(initialTask.description || '');
      setPriority(initialTask.priority || 'Medium');
      setStatus(initialTask.status || 'not started');
    } else {
      setFeature('');
      setDescription('');
      setPriority('Medium');
      setStatus('not started');
    }
    setError(null);
  }, [initialTask, mode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feature.trim()) {
      setError('Feature name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        feature: feature.trim(),
        description: description.trim(),
        priority,
        status,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save feature';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div>
            <h3 className="modal-title">
              {mode === 'create' ? 'Add New Feature' : 'Edit Feature'}
            </h3>
            <p className="modal-subtitle">
              System: <span className="highlight-system">{activeSystem.name}</span> (table: {activeSystem.tableName})
            </p>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="modal-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="feature-input" className="form-label">
              Feature Title <span className="required-star">*</span>
            </label>
            <input
              id="feature-input"
              type="text"
              className="form-input"
              placeholder="e.g. Vision detection, Door lock mechanism"
              value={feature}
              onChange={(e) => setFeature(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="desc-input" className="form-label">
              Description / Requirements
            </label>
            <textarea
              id="desc-input"
              className="form-textarea"
              rows={3}
              placeholder="Detailed description of the feature behavior, parameters or logic"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-row">
            {/* Priority selection */}
            <div className="form-group">
              <label className="form-label">Priority</label>
              <div className="priority-options">
                {(['High', 'Medium', 'Low'] as PriorityType[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`priority-select-btn ${p.toLowerCase()} ${
                      priority === p ? 'is-selected' : ''
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Status selection */}
            <div className="form-group">
              <label className="form-label">Status</label>
              <div className="status-options">
                <button
                  type="button"
                  onClick={() => setStatus('not started')}
                  className={`status-select-btn not-started ${
                    status === 'not started' ? 'is-selected' : ''
                  }`}
                >
                  <CircleDashed size={14} />
                  <span>Not Started</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('working')}
                  className={`status-select-btn working ${
                    status === 'working' ? 'is-selected' : ''
                  }`}
                >
                  <Clock size={14} />
                  <span>Working</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('done')}
                  className={`status-select-btn done ${
                    status === 'done' ? 'is-selected' : ''
                  }`}
                >
                  <CheckCircle2 size={14} />
                  <span>Done</span>
                </button>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : mode === 'create' ? (
                <>
                  <Plus size={16} />
                  <span>Add Feature</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Update Feature</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
