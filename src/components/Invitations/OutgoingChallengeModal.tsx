import React, { useEffect, useState } from 'react';
import { Swords, X, Clock, AlertCircle, RotateCcw } from 'lucide-react';
import { TIME_CONTROLS, type TimeControlId } from '../../types/chess';
import { onlineService } from '../../lib/onlineService';

interface OutgoingChallengeModalProps {
  invitationId: string | null;
  targetPlayerName: string;
  targetPlayerRating?: number;
  timeControlId: TimeControlId;
  onMatchStarted: (roomId: string) => void;
  onCancel: () => void;
  onInviteAgain: () => void;
}

export const OutgoingChallengeModal: React.FC<OutgoingChallengeModalProps> = ({
  invitationId,
  targetPlayerName,
  targetPlayerRating,
  timeControlId,
  onMatchStarted,
  onCancel,
  onInviteAgain
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [status, setStatus] = useState<'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled'>('pending');

  const tcConfig = TIME_CONTROLS[timeControlId] || TIME_CONTROLS['10+0'];

  // Real-time listener for invitation resolution
  useEffect(() => {
    if (!invitationId) return;

    setStatus('pending');
    setSecondsRemaining(60);

    const unsub = onlineService.listenToSentInvitation(invitationId, (newStatus, roomId) => {
      setStatus(newStatus);
      if (newStatus === 'accepted' && roomId) {
        // Small delay to let user see "Accepted!" feedback
        setTimeout(() => {
          onMatchStarted(roomId);
        }, 500);
      }
    });

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatus('expired');
          onlineService.markInvitationExpired(invitationId).catch(() => {});
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      unsub();
      clearInterval(timer);
    };
  }, [invitationId, onMatchStarted]);

  if (!invitationId) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '440px',
          padding: '1.75rem',
          borderRadius: '16px',
          background: 'rgba(15, 23, 42, 0.98)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 24px 50px rgba(0, 0, 0, 0.8), 0 0 24px rgba(56, 189, 248, 0.2)',
          textAlign: 'center',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Animated Icon status */}
        <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 1.25rem auto' }}>
          {status === 'pending' && (
            <div
              style={{
                position: 'absolute',
                inset: '-6px',
                borderRadius: '50%',
                border: '2px dashed rgba(56, 189, 248, 0.5)',
                animation: 'spin 8s linear infinite'
              }}
            />
          )}

          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background:
                status === 'accepted'
                  ? 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.1) 100%)'
                  : status === 'declined' || status === 'expired'
                  ? 'radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.05) 100%)'
                  : 'radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)',
              border: `2px solid ${
                status === 'accepted'
                  ? '#10b981'
                  : status === 'declined' || status === 'expired'
                  ? '#f43f5e'
                  : 'var(--accent-cyan)'
              }`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color:
                status === 'accepted'
                  ? '#10b981'
                  : status === 'declined' || status === 'expired'
                  ? '#f43f5e'
                  : 'var(--accent-cyan)'
            }}
          >
            {status === 'accepted' ? (
              <Swords size={36} />
            ) : status === 'declined' || status === 'expired' ? (
              <AlertCircle size={36} />
            ) : (
              <Swords size={36} />
            )}
          </div>
        </div>

        {/* Status text */}
        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.4rem' }}>
          {status === 'accepted'
            ? 'Challenge Accepted!'
            : status === 'declined'
            ? 'Challenge Declined'
            : status === 'expired'
            ? 'Challenge Expired'
            : 'Challenge Sent'}
        </h3>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.25rem' }}>
          {status === 'accepted'
            ? `Launching match with ${targetPlayerName}...`
            : status === 'declined'
            ? `${targetPlayerName} declined your match invitation.`
            : status === 'expired'
            ? `${targetPlayerName} did not respond within the time limit.`
            : `Waiting for ${targetPlayerName} to accept...`}
        </p>

        {/* Match details card */}
        <div
          style={{
            background: 'var(--bg-surface)',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1.5rem',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Opponent:</span>
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
              {targetPlayerName} {targetPlayerRating ? `(${targetPlayerRating})` : ''}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={14} /> Time Control:
            </span>
            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--accent-cyan)' }}>
              {tcConfig.name} ({tcConfig.category})
            </span>
          </div>

          {status === 'pending' && (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                Expires in {secondsRemaining}s
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          {status === 'pending' && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
              style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', fontSize: '0.92rem' }}
            >
              <X size={16} /> Cancel Challenge
            </button>
          )}

          {status === 'declined' && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
              style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', fontSize: '0.92rem' }}
            >
              Close
            </button>
          )}

          {status === 'expired' && (
            <>
              <button
                type="button"
                onClick={onCancel}
                className="btn-secondary"
                style={{ flex: 1, padding: '0.7rem', borderRadius: '10px', fontSize: '0.92rem' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={onInviteAgain}
                className="btn-primary"
                style={{ flex: 1, padding: '0.7rem', borderRadius: '10px', fontSize: '0.92rem' }}
              >
                <RotateCcw size={16} /> Invite Again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
