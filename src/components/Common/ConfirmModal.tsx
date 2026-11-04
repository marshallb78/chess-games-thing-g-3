import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel
}) => {
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus confirm button or handle Escape key
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      setTimeout(() => confirmBtnRef.current?.focus(), 50);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const getConfirmStyle = () => {
    if (variant === 'danger') {
      return {
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        color: '#ffffff',
        border: 'none',
        boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
      };
    }
    if (variant === 'warning') {
      return {
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        color: '#ffffff',
        border: 'none',
        boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)'
      };
    }
    return {
      background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
      color: '#ffffff',
      border: 'none',
      boxShadow: '0 4px 14px rgba(14, 165, 233, 0.4)'
    };
  };

  return (
    <div className="modal-overlay" onClick={onCancel} style={{ zIndex: 9999 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '420px',
          padding: '1.5rem',
          borderRadius: '16px',
          background: 'rgba(15, 23, 42, 0.98)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 24px 50px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.4)',
          animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: variant === 'danger' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: variant === 'danger' ? '#f87171' : '#fbbf24',
              flexShrink: 0
            }}
          >
            <AlertTriangle size={22} />
          </div>

          <div style={{ flex: 1 }}>
            <h3 id="confirm-modal-title" style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.35rem 0' }}>
              {title}
            </h3>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {message}
            </p>
          </div>

          <button
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px'
            }}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            style={{ padding: '0.55rem 1.1rem', fontSize: '0.9rem', borderRadius: '10px' }}
          >
            {cancelText}
          </button>

          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            style={{
              ...getConfirmStyle(),
              fontWeight: 600,
              padding: '0.55rem 1.25rem',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'transform 0.15s ease'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
