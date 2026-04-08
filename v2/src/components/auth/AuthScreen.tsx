import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const OTP_MIN_LENGTH = 6;
const OTP_MAX_LENGTH = 8;
const EMAIL_CHECK_DEBOUNCE_MS = 300;

type EmailStatus = 'idle' | 'checking' | 'allowed' | 'blocked';

type Props = {
  isSendingCode: boolean;
  isVerifyingCode: boolean;
  errorMessage: string;
  successMessage: string;
  onSendCode: (email: string) => Promise<void>;
  onCheckEmail: (email: string) => Promise<boolean>;
  onVerifyCode: (email: string, token: string) => Promise<void>;
  onClearFeedback: () => void;
  showDevPreviewHint?: boolean;
};

export function AuthScreen({
  isSendingCode,
  isVerifyingCode,
  errorMessage,
  successMessage,
  onSendCode,
  onCheckEmail,
  onVerifyCode,
  onClearFeedback,
  showDevPreviewHint = false,
}: Props) {
  const [authStep, setAuthStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [localError, setLocalError] = useState('');
  const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle');
  const [emailStatusMessage, setEmailStatusMessage] = useState('');

  const checkIdRef = useRef(0);
  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const isDevPreviewEmail = showDevPreviewHint && normalizedEmail === 'admin123';
  const canSendCode = isDevPreviewEmail || emailStatus === 'allowed';

  useEffect(() => {
    if (authStep !== 'email') return;

    if (!normalizedEmail) {
      setEmailStatus('idle');
      setEmailStatusMessage('');
      return;
    }

    if (isDevPreviewEmail) {
      setEmailStatus('allowed');
      setEmailStatusMessage('Local preview mode');
      return;
    }

    if (!isLikelyEmail(normalizedEmail)) {
      setEmailStatus('idle');
      setEmailStatusMessage('');
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const currentCheckId = checkIdRef.current + 1;
      checkIdRef.current = currentCheckId;
      setEmailStatus('checking');
      setEmailStatusMessage('Checking roster...');

      void onCheckEmail(normalizedEmail)
        .then((isAllowed) => {
          if (checkIdRef.current !== currentCheckId) return;

          if (isAllowed) {
            setEmailStatus('allowed');
            setEmailStatusMessage('Allowed to sign in');
            return;
          }

          setEmailStatus('blocked');
          setEmailStatusMessage('This email is not on the roster');
        })
        .catch(() => {
          if (checkIdRef.current !== currentCheckId) return;
          setEmailStatus('blocked');
          setEmailStatusMessage('Could not verify this email right now');
        });
    }, EMAIL_CHECK_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [authStep, isDevPreviewEmail, normalizedEmail, onCheckEmail]);

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isDevPreviewEmail && !isLikelyEmail(normalizedEmail)) {
      setLocalError('Please enter a valid email address.');
      onClearFeedback();
      return;
    }

    if (!canSendCode) {
      setLocalError('This email is not eligible for sign-in.');
      return;
    }

    setLocalError('');
    try {
      await onSendCode(normalizedEmail);
      if (!isDevPreviewEmail) {
        setAuthStep('otp');
      }
    } catch {
      // App-level error state already renders the message.
    }
  }

  async function handleOtpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (otp.length < OTP_MIN_LENGTH || otp.length > OTP_MAX_LENGTH) {
      setLocalError('Please enter the code from your email.');
      return;
    }

    setLocalError('');
    try {
      await onVerifyCode(email, otp);
    } catch {
      // App-level error state already renders the message.
    }
  }

  async function handleResendCode() {
    setLocalError('');
    try {
      await onSendCode(normalizedEmail);
    } catch {
      // App-level error state already renders the message.
    }
  }

  function handleUseDifferentEmail() {
    setAuthStep('email');
    setOtp('');
    setLocalError('');
    setEmailStatus('idle');
    setEmailStatusMessage('');
    onClearFeedback();
  }

  function handleOtpChange(nextValue: string) {
    const digitsOnly = nextValue.replace(/\D/g, '').slice(0, OTP_MAX_LENGTH);
    setOtp(digitsOnly);
    setLocalError('');
    onClearFeedback();
  }

  function handleEmailChange(nextValue: string) {
    setEmail(nextValue);
    setLocalError('');
    onClearFeedback();
  }

  return (
    <main className="auth-shell">
      <motion.section
        className="auth-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <p className="eyebrow">Welcome back</p>
        <h1 className="screen-title">Step into your yearbook.</h1>
        {authStep === 'email' ? (
          <>
            <p className="screen-subtitle">
              Enter your roster email to continue. We&apos;ll send a one-time code once it is verified.
            </p>

            <form className="auth-form" onSubmit={handleEmailSubmit} noValidate>
              <label className="composer-label" htmlFor="email-input">
                Email address
              </label>
              <input
                id="email-input"
                className="search-input"
                type="text"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="off"
                autoCorrect="off"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => handleEmailChange(event.target.value)}
              />
              <button
                type="submit"
                className="primary-btn auth-submit"
                disabled={isSendingCode || emailStatus === 'checking' || !canSendCode}
              >
                {isSendingCode ? 'Sending...' : 'Email me a code'}
              </button>
            </form>

            {emailStatus !== 'idle' ? (
              <p
                className={
                  emailStatus === 'allowed'
                    ? 'form-feedback form-feedback-success auth-email-status auth-email-status-allowed'
                    : emailStatus === 'checking'
                      ? 'form-feedback auth-email-status auth-email-status-checking'
                      : 'form-feedback form-feedback-error auth-email-status'
                }
              >
                {emailStatus === 'allowed' ? '✓ ' : ''}
                {emailStatusMessage}
              </p>
            ) : null}
          </>
        ) : (
          <>
            <p className="screen-subtitle">
              We sent a code to <strong>{email}</strong>.
            </p>

            <form className="auth-form" onSubmit={handleOtpSubmit} noValidate>
              <label className="composer-label" htmlFor="otp-input">
                One-time code
              </label>
              <input
                id="otp-input"
                className="search-input otp-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Enter your code"
                value={otp}
                onChange={(event) => handleOtpChange(event.target.value)}
                maxLength={OTP_MAX_LENGTH}
                autoFocus
              />
              <button
                type="submit"
                className="primary-btn auth-submit"
                disabled={isVerifyingCode || otp.length < OTP_MIN_LENGTH}
              >
                {isVerifyingCode ? 'Verifying...' : 'Verify and continue'}
              </button>
            </form>

            <div className="auth-secondary-row">
              <button
                type="button"
                className="ghost-chip auth-inline-link"
                onClick={() => void handleResendCode()}
                disabled={isSendingCode || isVerifyingCode}
              >
                {isSendingCode ? 'Resending...' : 'Resend code'}
              </button>
              <button
                type="button"
                className="ghost-chip auth-inline-link"
                onClick={handleUseDifferentEmail}
                disabled={isSendingCode || isVerifyingCode}
              >
                Use a different email
              </button>
            </div>
            <p className="auth-dev-hint">Didn&apos;t get it? Check spam or promotions.</p>
          </>
        )}

        {showDevPreviewHint ? (
          <p className="auth-dev-hint">
            Local dev shortcut: enter <strong>admin123</strong> to open preview mode.
          </p>
        ) : null}
        {successMessage ? <p className="form-feedback form-feedback-success">{successMessage}</p> : null}
        {localError ? <p className="form-feedback form-feedback-error">{localError}</p> : null}
        {errorMessage ? <p className="form-feedback form-feedback-error">{errorMessage}</p> : null}
      </motion.section>
    </main>
  );
}

function isLikelyEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
