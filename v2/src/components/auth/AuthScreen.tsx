import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';

type Props = {
  isSendingCode: boolean;
  isVerifyingCode: boolean;
  errorMessage: string;
  successMessage: string;
  onSendCode: (email: string) => Promise<void>;
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
  onVerifyCode,
  onClearFeedback,
  showDevPreviewHint = false,
}: Props) {
  const [authStep, setAuthStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [localError, setLocalError] = useState('');

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const isDevPreviewEmail = showDevPreviewHint && normalizedEmail === 'admin123';

    if (!isDevPreviewEmail && !isLikelyEmail(normalizedEmail)) {
      setLocalError('Please enter a valid email address.');
      onClearFeedback();
      return;
    }

    setLocalError('');
    try {
      await onSendCode(normalizedEmail);
      if (!isDevPreviewEmail) {
        setEmail(normalizedEmail);
        setAuthStep('otp');
      }
    } catch {
      // App-level error state already renders the message.
    }
  }

  async function handleOtpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (otp.length < 6) {
      setLocalError('Please enter the 6-digit code.');
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
      await onSendCode(email);
    } catch {
      // App-level error state already renders the message.
    }
  }

  function handleUseDifferentEmail() {
    setAuthStep('email');
    setOtp('');
    setLocalError('');
    onClearFeedback();
  }

  function handleOtpChange(nextValue: string) {
    const digitsOnly = nextValue.replace(/\D/g, '').slice(0, 6);
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
              Enter your class email and we will send a one-time code.
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
              <button type="submit" className="primary-btn auth-submit" disabled={isSendingCode}>
                {isSendingCode ? 'Sending...' : 'Email me a code'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="screen-subtitle">
              We sent a 6-digit code to <strong>{email}</strong>.
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
                placeholder="123456"
                value={otp}
                onChange={(event) => handleOtpChange(event.target.value)}
                maxLength={6}
                autoFocus
              />
              <button
                type="submit"
                className="primary-btn auth-submit"
                disabled={isVerifyingCode || otp.length < 6}
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
