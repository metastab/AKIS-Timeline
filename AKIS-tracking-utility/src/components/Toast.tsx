import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-viewport">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item ${toast.type} animate-fade-in`}>
          {toast.type === 'success' && <CheckCircle2 size={16} className="toast-icon" />}
          {toast.type === 'error' && <AlertCircle size={16} className="toast-icon" />}
          {toast.type === 'info' && <Info size={16} className="toast-icon" />}
          <span className="toast-msg">{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            className="toast-close"
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
