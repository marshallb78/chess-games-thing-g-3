import React, { useState } from 'react';
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

  if (!invitation) return null;

  const tcConfig = TIME_CONTROLS[invitation.timeControlId] || TIME_CONTROLS['10+0'];

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await onAccept(invitation);
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px', position: 'relative' }}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', color: 'var(--text-muted)' }}
        >
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
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

          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.2rem' }}>
            Match Challenge
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
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
              {invitation.senderName[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{invitation.senderName}</div>
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
            marginBottom: '1.5rem',
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

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleAccept}
            disabled={isAccepting}
            className="btn-primary"
            style={{ flex: 1, padding: '0.75rem', fontSize: '0.95rem' }}
          >
            <Check size={18} />
            <span>{isAccepting ? 'Connecting...' : 'Accept Match'}</span>
          </button>

          <button
            onClick={() => {
              onDecline(invitation.id);
              onClose();
            }}
            disabled={isAccepting}
            className="btn-secondary"
            style={{ padding: '0.75rem 1.25rem', fontSize: '0.95rem' }}
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};
