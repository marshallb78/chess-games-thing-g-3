import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Mail, Lock, User, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  onPlayAsGuest?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
  onPlayAsGuest
}) => {
  const { signIn, createAccount, resetPassword } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);

  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setDisplayName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const mapFirebaseError = (error: { code?: string; message?: string }): string => {
    const code = error.code || '';
    switch (code) {
      case 'auth/email-already-in-use':
        return 'This email address is already registered. Please sign in or reset your password.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-not-found':
        return 'No account was found with this email. Please check your spelling or create an account.';
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect email or password. Please verify your credentials or reset your password.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use at least 6 characters.';
      case 'auth/too-many-requests':
        return 'Access temporarily disabled due to multiple failed login attempts. Please wait a few minutes or reset your password.';
      case 'auth/network-request-failed':
        return 'Network connection failed. Please check your internet connection.';
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double-clicks / repeated submissions

    setErrorMessage(null);
    setSuccessMessage(null);

    // Basic client validation
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (mode === 'forgot') {
      setIsSubmitting(true);
      try {
        await resetPassword(trimmedEmail);
        setSuccessMessage('Password reset link sent! Check your email inbox (and spam folder).');
      } catch (err: unknown) {
        setErrorMessage(mapFirebaseError(err as { code?: string; message?: string }));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (mode === 'signup') {
      const trimmedName = displayName.trim();
      if (!trimmedName) {
        setErrorMessage('Please enter your player display name.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please re-enter them carefully.');
        return;
      }

      setIsSubmitting(true);
      try {
        await createAccount(trimmedName, trimmedEmail, password);
        handleClose();
      } catch (err: unknown) {
        setErrorMessage(mapFirebaseError(err as { code?: string; message?: string }));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (mode === 'signin') {
      setIsSubmitting(true);
      try {
        await signIn(trimmedEmail, password);
        handleClose();
      } catch (err: unknown) {
        setErrorMessage(mapFirebaseError(err as { code?: string; message?: string }));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            color: 'var(--text-muted)'
          }}
          title="Close"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.3rem' }}>
            {mode === 'signin' && 'Sign in to G+3 Games'}
            {mode === 'signup' && 'Create Your Player Account'}
            {mode === 'forgot' && 'Reset Your Password'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            {mode === 'signin' && 'Enter your registered credentials to play and track your rating.'}
            {mode === 'signup' && 'Choose your display name and email. Passwords are never stored on client.'}
            {mode === 'forgot' && 'Enter your email address to receive a secure password recovery link.'}
          </p>
        </div>

        {/* Alert Error Box */}
        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem',
              padding: '0.75rem',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '8px',
              color: '#fca5a5',
              fontSize: '0.85rem',
              marginBottom: '1.25rem'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <span>{errorMessage}</span>
              {errorMessage.includes('already registered') && (
                <div style={{ marginTop: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setMode('signin');
                    }}
                    style={{
                      background: 'none',
                      color: 'var(--accent-cyan)',
                      textDecoration: 'underline',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      padding: 0
                    }}
                  >
                    Click here to Sign In instead →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Alert Success Box */}
        {successMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.75rem',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '8px',
              color: '#6ee7b7',
              fontSize: '0.85rem',
              marginBottom: '1.25rem'
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {mode === 'signup' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Player Display Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. GrandmasterAce"
                  maxLength={24}
                  style={{ width: '100%', paddingLeft: '36px' }}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@school.edu"
                style={{ width: '100%', paddingLeft: '36px' }}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      setMode('forgot');
                    }}
                    style={{ background: 'none', color: 'var(--accent-cyan)', fontSize: '0.78rem', padding: 0 }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', paddingLeft: '36px' }}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', paddingLeft: '36px' }}
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontSize: '0.95rem' }}
          >
            {isSubmitting ? (
              <span>Connecting securely...</span>
            ) : mode === 'signin' ? (
              <>Sign In <ArrowRight size={16} /></>
            ) : mode === 'signup' ? (
              <>Create Account <ArrowRight size={16} /></>
            ) : (
              'Send Password Reset Email'
            )}
          </button>
        </form>

        {/* Footer Mode Switchers */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {mode === 'signin' && (
            <p>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setMode('signup');
                }}
                style={{ background: 'none', color: 'var(--accent-cyan)', fontWeight: 600, padding: 0 }}
              >
                Create account
              </button>
            </p>
          )}

          {mode === 'signup' && (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setMode('signin');
                }}
                style={{ background: 'none', color: 'var(--accent-cyan)', fontWeight: 600, padding: 0 }}
              >
                Sign in
              </button>
            </p>
          )}

          {mode === 'forgot' && (
            <p>
              Remembered your password?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setMode('signin');
                }}
                style={{ background: 'none', color: 'var(--accent-cyan)', fontWeight: 600, padding: 0 }}
              >
                Back to Sign In
              </button>
            </p>
          )}

          {onPlayAsGuest && (
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  onPlayAsGuest();
                }}
                className="btn-secondary"
                style={{ width: '100%', padding: '0.65rem', fontSize: '0.88rem' }}
              >
                Play as Guest (Skip for now)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

