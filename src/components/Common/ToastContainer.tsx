import React from 'react';
import { useToast, type ToastType } from '../../context/ToastContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0 }} />;
      case 'warning':
        return <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />;
      case 'error':
        return <AlertCircle size={18} style={{ color: '#f43f5e', flexShrink: 0 }} />;
      case 'info':
      default:
        return <Info size={18} style={{ color: '#38bdf8', flexShrink: 0 }} />;
    }
  };

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'rgba(16, 185, 129, 0.4)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.4)';
      case 'error':
        return 'rgba(244, 63, 94, 0.4)';
      case 'info':
      default:
        return 'rgba(56, 189, 248, 0.4)';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        maxWidth: '380px',
        width: 'calc(100vw - 40px)',
        pointerEvents: 'none'
      }}
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            pointerEvents: 'auto',
            background: 'rgba(15, 23, 42, 0.96)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: `1.5px solid ${getBorderColor(toast.type)}`,
            borderRadius: '12px',
            padding: '0.75rem 0.9rem',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.7), 0 0 16px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            color: 'var(--text-primary)'
          }}
        >
          <div style={{ marginTop: '2px' }}>{getIcon(toast.type)}</div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {toast.title && (
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  marginBottom: '2px',
                  color: 'var(--text-primary)'
                }}
              >
                {toast.title}
              </div>
            )}
            <div
              style={{
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
                wordBreak: 'break-word'
              }}
            >
              {toast.message}
            </div>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'color 0.15s ease'
            }}
            aria-label="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
};
