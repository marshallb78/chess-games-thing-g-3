import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  UserPlus,
  LogIn,
  Sparkles
} from 'lucide-react';

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
  const { signIn, createAccount, resetPassword, checkEmailExists } = useAuth();
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
  const [noAccountDetected, setNoAccountDetected] = useState(false);
  const [accountAlreadyExists, setAccountAlreadyExists] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'exists' | 'not-found'>('idle');

  // Sync mode with initialMode whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage(null);
      setSuccessMessage(null);
      setNoAccountDetected(false);
      setAccountAlreadyExists(false);
      setEmailStatus('idle');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const resetForm = () => {
    setDisplayName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    setSuccessMessage(null);
    setNoAccountDetected(false);
    setAccountAlreadyExists(false);
    setEmailStatus('idle');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSwitchToSignUp = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setNoAccountDetected(false);
    setAccountAlreadyExists(false);
    setMode('signup');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSwitchToSignIn = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setNoAccountDetected(false);
    setAccountAlreadyExists(false);
    setMode('signin');
    setPassword('');
  };

  const handleEmailBlur = async () => {
    const clean = email.trim();
    if (!clean || !clean.includes('@') || !clean.includes('.')) {
      setEmailStatus('idle');
      return;
    }
    setEmailStatus('checking');
    try {
      const exists = await checkEmailExists(clean);
      setEmailStatus(exists ? 'exists' : 'not-found');
    } catch {
      setEmailStatus('idle');
    }
  };

  const mapFirebaseError = (error: { code?: string; message?: string }): string => {
    const code = error.code || '';
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account already exists with this email address. Please sign in instead.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-not-found':
        return 'No account was found with this email. Please create an account to start playing.';
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
    if (isSubmitting) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setNoAccountDetected(false);
    setAccountAlreadyExists(false);

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
        const fbErr = err as { code?: string; message?: string };
        if (fbErr.code === 'auth/email-already-in-use') {
          setAccountAlreadyExists(true);
          setErrorMessage('An account already exists with this email address. Please sign in instead.');
        } else {
          setErrorMessage(mapFirebaseError(fbErr));
        }
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
        const fbErr = err as { code?: string; message?: string };
        if (fbErr.code === 'auth/user-not-found') {
          setNoAccountDetected(true);
          setErrorMessage('No account was found with this email. You can create an account right now!');
        } else {
          setErrorMessage(mapFirebaseError(fbErr));
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const isNoAccount =
    noAccountDetected ||
    (errorMessage !== null &&
      (errorMessage.includes('No account was found') ||
        errorMessage.includes('No account found')));

  const isEmailInUse =
    accountAlreadyExists ||
    (errorMessage !== null &&
      (errorMessage.includes('already exists') ||
        errorMessage.includes('already registered')));

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          maxWidth: '460px',
          width: '100%',
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
        }}
      >
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            color: 'var(--text-muted)'
          }}
          title="Close (Play as Guest)"
        >
          <X size={20} />
        </button>

        {/* Highly Recommended Badge & Callout */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.65rem 0.85rem',
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '10px',
            marginBottom: '1.25rem',
            boxShadow: '0 0 16px rgba(56, 189, 248, 0.1)'
          }}
        >
          <span
            style={{
              background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.68rem',
              letterSpacing: '0.5px',
              padding: '3px 8px',
              borderRadius: '6px',
              textTransform: 'uppercase',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 0 8px rgba(56, 189, 248, 0.5)'
            }}
          >
            <Sparkles size={12} style={{ marginRight: '4px' }} /> Highly Recommended
          </span>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
            Sign in or create an account to save your rating, track wins, and challenge friends!
          </span>
        </div>

        {/* Modal Header */}
        <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '0.3rem', letterSpacing: '-0.3px' }}>
            {mode === 'signin' && 'Sign in to G+3 Games'}
            {mode === 'signup' && 'Create Your Player Account'}
            {mode === 'forgot' && 'Reset Your Password'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {mode === 'signin' && 'Enter your credentials to access your saved ratings and match history.'}
            {mode === 'signup' && 'Join the G+3 community! Choose your username and password below.'}
            {mode === 'forgot' && 'Enter your email address to receive a secure password recovery link.'}
          </p>
        </div>

        {/* Alert Error Box */}
        {errorMessage && (
          <div
            style={{
              padding: '0.85rem',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '10px',
              color: '#fca5a5',
              fontSize: '0.85rem',
              marginBottom: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600 }}>{errorMessage}</span>
              </div>
            </div>

            {/* When No Account is found during Sign In: offer direct button to create account */}
            {isNoAccount && (
              <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid rgba(239, 68, 68, 0.25)' }}>
                <button
                  type="button"
                  onClick={handleSwitchToSignUp}
                  className="btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    width: '100%',
                    padding: '0.55rem 0.85rem',
                    fontSize: '0.85rem',
                    background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)'
                  }}
                >
                  <UserPlus size={16} /> Create an Account with this Email
                </button>
              </div>
            )}

            {/* When Account already exists during Sign Up: offer direct button to sign in */}
            {isEmailInUse && (
              <div style={{ marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid rgba(239, 68, 68, 0.25)' }}>
                <button
                  type="button"
                  onClick={handleSwitchToSignIn}
                  className="btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    width: '100%',
                    padding: '0.55rem 0.85rem',
                    fontSize: '0.85rem',
                    background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)'
                  }}
                >
                  <LogIn size={16} /> Sign In with this Email
                </button>
              </div>
            )}
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
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage(null);
                  setNoAccountDetected(false);
                  setAccountAlreadyExists(false);
                  setEmailStatus('idle');
                }}
                onBlur={handleEmailBlur}
                placeholder="name@example.com"
                style={{ width: '100%', paddingLeft: '36px' }}
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Real-time email notice when detected */}
            {mode === 'signin' && emailStatus === 'not-found' && !errorMessage && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '0.35rem',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  fontSize: '0.76rem',
                  color: 'var(--accent-amber)'
                }}
              >
                <span>No account found with this email</span>
                <button
                  type="button"
                  onClick={handleSwitchToSignUp}
                  style={{
                    background: 'none',
                    color: 'var(--accent-cyan)',
                    fontWeight: 600,
                    padding: 0,
                    textDecoration: 'underline',
                    fontSize: '0.76rem'
                  }}
                >
                  Create account →
                </button>
              </div>
            )}

            {mode === 'signup' && emailStatus === 'exists' && !errorMessage && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '0.35rem',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  fontSize: '0.76rem',
                  color: 'var(--accent-cyan)'
                }}
              >
                <span>An account already exists with this email</span>
                <button
                  type="button"
                  onClick={handleSwitchToSignIn}
                  style={{
                    background: 'none',
                    color: '#ffffff',
                    fontWeight: 600,
                    padding: 0,
                    textDecoration: 'underline',
                    fontSize: '0.76rem'
                  }}
                >
                  Sign in instead →
                </button>
              </div>
            )}
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
            style={{
              width: '100%',
              padding: '0.75rem',
              marginTop: '0.4rem',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
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
        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {mode === 'signin' && (
            <p>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={handleSwitchToSignUp}
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
                onClick={handleSwitchToSignIn}
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
                onClick={handleSwitchToSignIn}
                style={{ background: 'none', color: 'var(--accent-cyan)', fontWeight: 600, padding: 0 }}
              >
                Back to Sign In
              </button>
            </p>
          )}

          {onPlayAsGuest && (
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  onPlayAsGuest();
                }}
                className="btn-secondary"
                style={{ width: '100%', padding: '0.65rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}
              >
                Play as Guest (Skip for now)
              </button>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                You can click outside this window to dismiss and play as guest anytime.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
