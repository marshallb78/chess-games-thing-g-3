import React, { useEffect, useState } from 'react';
import type { MatchInvitationData } from '../../lib/onlineService';
import { Swords, Eye, X } from 'lucide-react';

interface InvitationToastProps {
  invitation: MatchInvitationData | null;
  onView: (invitation: MatchInvitationData) => void;
  onDecline: (invitationId: string) => void;
}

export const InvitationToast: React.FC<InvitationToastProps> = ({
  invitation,
  onView,
  onDecline
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  useEffect(() => {
    if (!invitation) return;

    const expiresAt = invitation.expiresAt || invitation.createdAt + 60000;
    const initialSec = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
    setSecondsRemaining(initialSec);

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [invitation]);

  if (!invitation) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.96)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1.5px solid var(--accent-cyan)',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.7), 0 0 20px var(--accent-cyan-glow)',
        borderRadius: '14px',
        padding: '0.85rem 1rem',
        maxWidth: '360px',
        width: 'calc(100vw - 40px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        animation: 'slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      role="alert"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)'
            }}
          >
            <Swords size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {invitation.senderName}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Challenged you to {invitation.timeControlId} ({secondsRemaining}s)
            </div>
          </div>
        </div>

        <button
          onClick={() => onDecline(invitation.id)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            padding: '2px',
            cursor: 'pointer'
          }}
          title="Decline & Dismiss"
          aria-label="Decline match invitation"
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => onView(invitation)}
          className="btn-primary"
          style={{ flex: 1, padding: '0.45rem', fontSize: '0.82rem', borderRadius: '8px' }}
        >
          <Eye size={14} /> View Details
        </button>

        <button
          onClick={() => onDecline(invitation.id)}
          className="btn-secondary"
          style={{ padding: '0.45rem 0.8rem', fontSize: '0.82rem', borderRadius: '8px' }}
        >
          Decline
        </button>
      </div>
    </div>
  );
};
