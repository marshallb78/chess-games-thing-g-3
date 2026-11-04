import React, { useState, useEffect } from 'react';
import type { MatchInvitationData } from '../../lib/onlineService';
import { TIME_CONTROLS } from '../../types/chess';
import { Swords, X, Check, Clock, Trophy } from 'lucide-react';

interface InvitationModalProps {
  invitation: MatchInvitationData | null;
  onAccept: (invitation: MatchInvitationData) => Promise<void>;
  onDecline: (invitationId: string) => void;
  onClose: () => void;
}

export const InvitationModal: React.FC<InvitationModalProps> = ({
  invitation,
  onAccept,
  onDecline,
  onClose
}) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  useEffect(() => {
    if (!invitation) return;

    setErrorMessage(null);
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

  const tcConfig = TIME_CONTROLS[invitation.timeControlId] || TIME_CONTROLS['10+0'];
  const isExpired = secondsRemaining <= 0;

  const handleAccept = async () => {
    setIsAccepting(true);
    setErrorMessage(null);
    try {
      await onAccept(invitation);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Failed to accept invitation.');
      setIsAccepting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '440px',
          position: 'relative',
          padding: '1.75rem',
          borderRadius: '16px',
          background: 'rgba(15, 23, 42, 0.98)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 24px 50px rgba(0, 0, 0, 0.8), 0 0 24px rgba(56, 189, 248, 0.25)',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px'
          }}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)',
              border: '1.5px solid rgba(56, 189, 248, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)',
              margin: '0 auto 0.75rem auto'
            }}
          >
            <Swords size={32} />
          </div>

          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.2rem' }}>
            Match Challenge
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            You have been invited to a live chess match.
          </p>
        </div>

        {/* Sender details card */}
        <div
          style={{
            background: 'var(--bg-surface)',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
                color: 'white',
                fontWeight: 700,
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {invitation.senderName[0]?.toUpperCase() || 'P'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                {invitation.senderName}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Challenger</div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-cyan)', fontWeight: 700 }}>
              <Trophy size={14} />
              <span>{invitation.senderRating || 1200}</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Rating</div>
          </div>
        </div>

        {/* Match settings summary */}
        <div
          style={{
            background: 'var(--bg-surface)',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.88rem'
          }}
        >
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} /> Time Control:
          </span>
          <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
            {tcConfig.name} ({tcConfig.category})
          </span>
        </div>

        {/* Expiration countdown */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <span
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color: isExpired ? '#f43f5e' : 'var(--text-secondary)'
            }}
          >
            {isExpired ? 'This invitation has expired.' : `Expires in ${secondsRemaining}s`}
          </span>
        </div>

        {errorMessage && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: '8px',
              padding: '0.65rem 0.85rem',
              color: '#f87171',
              fontSize: '0.82rem',
              marginBottom: '1.25rem',
              textAlign: 'center'
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleAccept}
            disabled={isAccepting || isExpired}
            className="btn-primary"
            style={{ flex: 1, padding: '0.75rem', fontSize: '0.95rem', borderRadius: '10px' }}
          >
            <Check size={18} />
            <span>{isAccepting ? 'Connecting...' : isExpired ? 'Expired' : 'Accept Match'}</span>
          </button>

          <button
            onClick={() => {
              onDecline(invitation.id);
              onClose();
            }}
            disabled={isAccepting}
            className="btn-secondary"
            style={{ padding: '0.75rem 1.25rem', fontSize: '0.95rem', borderRadius: '10px' }}
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};
