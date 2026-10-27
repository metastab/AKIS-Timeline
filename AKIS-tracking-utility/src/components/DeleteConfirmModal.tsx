import React, { useState } from 'react';
import type { TaskItem } from '../types';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  task: TaskItem | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  task,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !task) return null;

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card delete-card animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
      >
        <div className="delete-modal-icon-wrap">
          <AlertTriangle size={28} className="delete-warning-icon" />
        </div>

        <div className="delete-modal-content">
          <h3 className="delete-modal-title">Delete Checklist Item?</h3>
          <p className="delete-modal-text">
            Are you sure you want to permanently delete{' '}
            <strong className="delete-task-name">"{task.feature}"</strong>?
            This will remove the record directly from your Supabase table.
          </p>
        </div>

        <div className="modal-actions delete-actions">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="btn-danger"
          >
            {isDeleting ? (
              <span>Deleting...</span>
            ) : (
              <>
                <Trash2 size={16} />
                <span>Delete Task</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
