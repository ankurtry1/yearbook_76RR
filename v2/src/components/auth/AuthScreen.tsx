import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';

type Props = {
  isSending: boolean;
  errorMessage: string;
  successMessage: string;
  onSendLink: (email: string) => Promise<void>;
  showDevPreviewHint?: boolean;
};

export function AuthScreen({
  isSending,
  errorMessage,
  successMessage,
  onSendLink,
  showDevPreviewHint = false,
}: Props) {
  const [email, setEmail] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSendLink(email);
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
        <p className="screen-subtitle">
          Enter your class email and we will send a one-time sign-in link.
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
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
            onChange={(event) => setEmail(event.target.value)}
          />
          <button type="submit" className="primary-btn auth-submit" disabled={isSending}>
            {isSending ? 'Sending...' : 'Send sign-in link'}
          </button>
        </form>

        {showDevPreviewHint ? (
          <p className="auth-dev-hint">
            Local dev shortcut: enter <strong>admin123</strong> to open preview mode.
          </p>
        ) : null}
        {successMessage ? <p className="form-feedback form-feedback-success">{successMessage}</p> : null}
        {errorMessage ? <p className="form-feedback form-feedback-error">{errorMessage}</p> : null}
      </motion.section>
    </main>
  );
}
