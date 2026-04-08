import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AuthScreen } from './components/auth/AuthScreen';
import { DesktopWriteBoard } from './components/desktop/DesktopWriteBoard';
import { MobileStoryDiscovery } from './components/mobile/MobileStoryDiscovery';
import { ReadWall } from './components/read/ReadWall';
import { MOCK_PEOPLE } from './data/mock/seed';
import { useViewportMode } from './lib/hooks/useViewportMode';
import {
  clearDevPreviewMode,
  isDevAdminPreviewCode,
  persistDevPreviewMode,
  readPersistedDevPreviewMode,
} from './lib/preview/devAdminPreview';
import {
  getCurrentUser,
  sendEmailOtp,
  signOutUser,
  subscribeToAuthChanges,
  verifyEmailOtp,
} from './lib/supabase/auth';
import {
  bootstrapProfilePersonForAuthUser,
  createMemory,
  fetchMemoriesByRecipient,
  fetchPeople,
} from './lib/supabase/yearbook';
import type { Memory, Person, SortMode, ViewMode } from './lib/utils/types';

type AuthStatus = 'loading' | 'signed_out' | 'signed_in';
type AccessMode = 'supabase' | 'admin-preview';

export default function App() {
  const viewportMode = useViewportMode();

  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [accessMode, setAccessMode] = useState<AccessMode>('supabase');
  const [signedInEmail, setSignedInEmail] = useState('');
  const [viewerPerson, setViewerPerson] = useState<Person | null>(null);
  const [authError, setAuthError] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [authRequestMessage, setAuthRequestMessage] = useState('');
  const [isSigningOut, setIsSigningOut] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>('write');
  const [sortMode, setSortMode] = useState<SortMode>('newest');

  const [people, setPeople] = useState<Person[]>([]);
  const [selectedWritePersonId, setSelectedWritePersonId] = useState<string | null>(null);
  const [selectedReadPersonId, setSelectedReadPersonId] = useState<string | null>(null);
  const [isPeopleLoading, setIsPeopleLoading] = useState(true);
  const [peopleError, setPeopleError] = useState('');

  const [previewMemories, setPreviewMemories] = useState<Memory[]>([]);
  const [readMemories, setReadMemories] = useState<Memory[]>([]);
  const [isReadMemoriesLoading, setIsReadMemoriesLoading] = useState(false);
  const [readMemoriesError, setReadMemoriesError] = useState('');

  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [writeError, setWriteError] = useState('');
  const [writeSuccess, setWriteSuccess] = useState('');

  const isAdminPreview = accessMode === 'admin-preview';
  const canAccessApp = authStatus === 'signed_in' && (isAdminPreview || !!viewerPerson);

  const selectedWritePerson = useMemo(() => {
    return people.find((person) => person.id === selectedWritePersonId) ?? null;
  }, [people, selectedWritePersonId]);

  const selectedReadPerson = useMemo(() => {
    if (isAdminPreview) {
      return people.find((person) => person.id === selectedReadPersonId) ?? null;
    }
    return viewerPerson;
  }, [isAdminPreview, people, selectedReadPersonId, viewerPerson]);

  const effectiveAuthorPerson = useMemo(() => {
    if (isAdminPreview) return people[0] ?? null;
    return viewerPerson;
  }, [isAdminPreview, people, viewerPerson]);

  const displayedReadMemories = useMemo(() => {
    if (sortMode === 'newest') return readMemories;
    return shuffle(readMemories);
  }, [readMemories, sortMode]);

  const isAdminPreviewRef = useRef(false);
  useEffect(() => {
    isAdminPreviewRef.current = isAdminPreview;
  }, [isAdminPreview]);

  useEffect(() => {
    void bootstrapAuth();

    const subscription = subscribeToAuthChanges((session) => {
      if (isAdminPreviewRef.current) return;

      const user = session?.user ?? null;

      if (!user) {
        setAuthStatus('signed_out');
        setSignedInEmail('');
        setViewerPerson(null);
        setAuthError('');
        setAccessMode('supabase');
        resetAppData();
        return;
      }

      void handleSignedInUser(user.id, user.email ?? '');
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!canAccessApp) {
      resetPeopleState();
      return;
    }

    if (isAdminPreview) {
      void loadPeople(null, true);
      return;
    }

    if (viewerPerson) {
      void loadPeople(viewerPerson.id, false);
    }
  }, [canAccessApp, isAdminPreview, viewerPerson?.id]);

  useEffect(() => {
    if (!canAccessApp) {
      setReadMemories([]);
      return;
    }

    if (isAdminPreview) {
      setIsReadMemoriesLoading(false);
      setReadMemoriesError('');

      if (!selectedReadPersonId) {
        setReadMemories([]);
        return;
      }

      const next = sortByNewest(
        previewMemories.filter((memory) => memory.recipientId === selectedReadPersonId),
      );
      setReadMemories(next);
      return;
    }

    if (viewerPerson) {
      void loadReadMemories(viewerPerson.id);
    }
  }, [canAccessApp, isAdminPreview, previewMemories, selectedReadPersonId, viewerPerson?.id]);

  async function bootstrapAuth() {
    setAuthStatus('loading');
    setAuthError('');

    if (readPersistedDevPreviewMode()) {
      enterAdminPreview();
      return;
    }

    try {
      const user = await getCurrentUser();

      if (!user) {
        setAuthStatus('signed_out');
        return;
      }

      await handleSignedInUser(user.id, user.email ?? '');
    } catch (error) {
      setAuthStatus('signed_out');
      setAuthError(readErrorMessage(error, 'Could not load auth session.'));
    }
  }

  function enterAdminPreview() {
    setAccessMode('admin-preview');
    setAuthStatus('signed_in');
    setSignedInEmail('admin123');
    setViewerPerson(null);
    setAuthError('');
    setAuthRequestMessage('Admin Preview Mode · local only');
    persistDevPreviewMode();
  }

  async function handleSignedInUser(userId: string, email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    setAuthStatus('loading');
    setAccessMode('supabase');
    setSignedInEmail(normalizedEmail);
    setAuthError('');
    setAuthRequestMessage('');
    clearDevPreviewMode();

    if (!normalizedEmail) {
      setViewerPerson(null);
      setAuthStatus('signed_in');
      setAuthError('Signed-in user has no email. Contact admin to fix this account.');
      return;
    }

    try {
      const person = await bootstrapProfilePersonForAuthUser({
        userId,
        email: normalizedEmail,
      });

      if (!person) {
        setViewerPerson(null);
        setAuthStatus('signed_in');
        setAuthError('This email is not on the roster yet. Ask admin to add your allowed_email.');
        resetAppData();
        return;
      }

      setViewerPerson(person);
      setAuthStatus('signed_in');
      setAuthError('');
    } catch (error) {
      setViewerPerson(null);
      setAuthStatus('signed_in');
      setAuthError(readErrorMessage(error, 'Could not resolve your roster access.'));
      resetAppData();
    }
  }

  async function loadPeople(defaultPersonId: string | null, usePreviewFallback: boolean) {
    setIsPeopleLoading(true);
    setPeopleError('');

    try {
      let nextPeople = await fetchPeople();

      if (usePreviewFallback && nextPeople.length === 0) {
        nextPeople = MOCK_PEOPLE;
      }

      setPeople(nextPeople);

      setSelectedWritePersonId((previousId) => {
        if (!nextPeople.length) return null;
        if (previousId && nextPeople.some((person) => person.id === previousId)) return previousId;
        if (defaultPersonId && nextPeople.some((person) => person.id === defaultPersonId)) return defaultPersonId;
        return nextPeople[0].id;
      });

      if (isAdminPreview) {
        setSelectedReadPersonId((previousId) => {
          if (!nextPeople.length) return null;
          if (previousId && nextPeople.some((person) => person.id === previousId)) return previousId;
          return nextPeople[0].id;
        });
        setPreviewMemories(buildPreviewMemories(nextPeople));
      } else {
        setSelectedReadPersonId(defaultPersonId);
      }
    } catch (error) {
      if (usePreviewFallback) {
        const fallbackPeople = MOCK_PEOPLE;
        setPeople(fallbackPeople);
        setPeopleError('Using local preview roster because Supabase access is unavailable.');
        setSelectedWritePersonId(fallbackPeople[0]?.id ?? null);
        setSelectedReadPersonId(fallbackPeople[0]?.id ?? null);
        setPreviewMemories(buildPreviewMemories(fallbackPeople));
      } else {
        setPeopleError(readErrorMessage(error, 'Could not load people.'));
      }
    } finally {
      setIsPeopleLoading(false);
    }
  }

  async function loadReadMemories(recipientId: string) {
    setIsReadMemoriesLoading(true);
    setReadMemoriesError('');

    try {
      const nextMemories = await fetchMemoriesByRecipient(recipientId);
      setReadMemories(nextMemories);
    } catch (error) {
      setReadMemoriesError(readErrorMessage(error, 'Could not load private memories.'));
      setReadMemories([]);
    } finally {
      setIsReadMemoriesLoading(false);
    }
  }

  async function handleCreateMemory() {
    setWriteError('');
    setWriteSuccess('');

    if (!selectedWritePersonId) {
      setWriteError('Pick someone first so we know where to send this memoir.');
      return;
    }

    if (!effectiveAuthorPerson) {
      setWriteError('Could not resolve author profile. Please refresh and try again.');
      return;
    }

    const cleanAuthorName = effectiveAuthorPerson.fullName.trim();
    const cleanMessage = message.trim();

    if (!cleanMessage) {
      setWriteError('Please add a message before sending.');
      return;
    }

    if (isAdminPreview) {
      const localMemory: Memory = {
        id: `preview-local-${Date.now()}`,
        recipientId: selectedWritePersonId,
        authorId: effectiveAuthorPerson.id,
        authorName: cleanAuthorName,
        message: cleanMessage,
        createdAt: new Date().toISOString(),
      };

      setPreviewMemories((previous) => sortByNewest([localMemory, ...previous]));
      setMessage('');
      setWriteSuccess(`Preview saved for ${selectedWritePerson?.fullName ?? 'selected person'} (local only).`);
      return;
    }

    setIsSaving(true);

    try {
      await createMemory({
        recipientId: selectedWritePersonId,
        authorId: effectiveAuthorPerson.id,
        authorName: cleanAuthorName,
        message: cleanMessage,
      });

      setMessage('');
      setWriteSuccess(`Saved for ${selectedWritePerson?.fullName ?? 'selected person'}.`);

      if (viewerPerson && selectedWritePersonId === viewerPerson.id) {
        await loadReadMemories(viewerPerson.id);
      }
    } catch (error) {
      setWriteError(readErrorMessage(error, 'Could not save memory.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSendOtpCode(email: string) {
    setAuthError('');
    setAuthRequestMessage('');
    setIsSendingCode(true);

    try {
      if (isDevAdminPreviewCode(email)) {
        enterAdminPreview();
        return;
      }

      await sendEmailOtp(email);
      setAuthRequestMessage('We sent a code to your email.');
    } catch (error) {
      setAuthError(readErrorMessage(error, 'Could not send sign-in code.'));
      throw error;
    } finally {
      setIsSendingCode(false);
    }
  }

  async function handleVerifyOtpCode(email: string, token: string) {
    setAuthError('');
    setAuthRequestMessage('');
    setIsVerifyingCode(true);

    try {
      await verifyEmailOtp(email, token);
      setAuthRequestMessage('Code verified. Signing you in...');
    } catch (error) {
      setAuthError(readErrorMessage(error, 'Could not verify one-time code.'));
      throw error;
    } finally {
      setIsVerifyingCode(false);
    }
  }

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      if (isAdminPreview) {
        clearDevPreviewMode();
        setAuthStatus('signed_out');
        setAccessMode('supabase');
        setSignedInEmail('');
        setViewerPerson(null);
        setAuthError('');
        resetAppData();
        return;
      }

      await signOutUser();
      setAuthStatus('signed_out');
      setSignedInEmail('');
      setViewerPerson(null);
      setAccessMode('supabase');
      setAuthError('');
      resetAppData();
    } catch (error) {
      setAuthError(readErrorMessage(error, 'Could not sign out.'));
    } finally {
      setIsSigningOut(false);
    }
  }

  function resetPeopleState() {
    setPeople([]);
    setSelectedWritePersonId(null);
    setSelectedReadPersonId(null);
    setIsPeopleLoading(false);
    setPeopleError('');
  }

  function resetAppData() {
    resetPeopleState();
    setPreviewMemories([]);
    setReadMemories([]);
    setReadMemoriesError('');
    setWriteError('');
    setWriteSuccess('');
  }

  if (authStatus === 'loading') {
    return (
      <div className="app-shell">
        <section className="state-panel">Loading your yearbook session...</section>
      </div>
    );
  }

  if (authStatus === 'signed_out') {
    return (
      <AuthScreen
        isSendingCode={isSendingCode}
        isVerifyingCode={isVerifyingCode}
        errorMessage={authError}
        successMessage={authRequestMessage}
        onSendCode={handleSendOtpCode}
        onVerifyCode={handleVerifyOtpCode}
        onClearFeedback={() => {
          setAuthError('');
          setAuthRequestMessage('');
        }}
        showDevPreviewHint={import.meta.env.DEV}
      />
    );
  }

  if (!isAdminPreview && !viewerPerson) {
    return (
      <div className="app-shell">
        <header className="topbar">
          <div className="brand-lockup">
            <span className="brand-script">The Yearbook</span>
            <span className="brand-sub">Private memories for your class</span>
          </div>
          <button type="button" className="ghost-chip" onClick={handleSignOut} disabled={isSigningOut}>
            {isSigningOut ? 'Signing out...' : 'Sign out'}
          </button>
        </header>
        <section className="state-panel state-panel-error">
          {authError || 'You are signed in, but this email is not mapped to a roster entry yet.'}
        </section>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-script">The Yearbook</span>
          <span className="brand-sub">Private memories for your class</span>
        </div>
        {viewportMode === 'mobile' ? (
          <div className="topbar-actions topbar-actions-mobile">
            <nav className="mode-switch mode-switch-mobile">
              <button
                type="button"
                aria-label="Write mode"
                title="Write mode"
                className={viewMode === 'write' ? 'mode-btn active' : 'mode-btn'}
                onClick={() => setViewMode('write')}
              >
                W
              </button>
              <button
                type="button"
                aria-label="Read mode"
                title="Read mode"
                className={viewMode === 'read' ? 'mode-btn active' : 'mode-btn'}
                onClick={() => setViewMode('read')}
              >
                R
              </button>
            </nav>

            <details className="account-menu">
              <summary className="account-pill" aria-label="Account menu">
                {(isAdminPreview ? 'A' : (viewerPerson?.fullName?.slice(0, 1) ?? 'Y')).toUpperCase()}
              </summary>
              <div className="account-popover">
                <p className="account-name">{isAdminPreview ? 'Admin Preview' : viewerPerson?.fullName}</p>
                <p className="account-meta">{isAdminPreview ? 'Local mode' : `Room ${viewerPerson?.roomNo ?? '-'}`}</p>
                <p className="account-meta">{signedInEmail}</p>
                <button type="button" className="ghost-chip account-signout" onClick={handleSignOut} disabled={isSigningOut}>
                  {isSigningOut ? 'Signing out...' : isAdminPreview ? 'Exit preview' : 'Sign out'}
                </button>
              </div>
            </details>
          </div>
        ) : (
          <div className="topbar-actions">
            <div className="signed-in-chip">
              <span className="signed-in-name">{isAdminPreview ? 'Admin Preview' : viewerPerson?.fullName}</span>
              <span className="signed-in-meta">
                {isAdminPreview ? 'Local mode' : `Room ${viewerPerson?.roomNo ?? '-'}`}
              </span>
              <span className="signed-in-meta">{signedInEmail}</span>
            </div>
            <nav className="mode-switch">
              <button
                type="button"
                className={viewMode === 'write' ? 'mode-btn active' : 'mode-btn'}
                onClick={() => setViewMode('write')}
              >
                Write
              </button>
              <button
                type="button"
                className={viewMode === 'read' ? 'mode-btn active' : 'mode-btn'}
                onClick={() => setViewMode('read')}
              >
                Read
              </button>
            </nav>
            <button type="button" className="ghost-chip" onClick={handleSignOut} disabled={isSigningOut}>
              {isSigningOut ? 'Signing out...' : isAdminPreview ? 'Exit preview' : 'Sign out'}
            </button>
          </div>
        )}
      </header>

      {isAdminPreview ? (
        <div className="preview-banner">
          <span className="preview-pill">Admin Preview Mode</span>
          <span>Local only</span>
        </div>
      ) : null}

      {viewMode === 'write' && selectedWritePerson && viewportMode !== 'mobile' ? (
        <div className="selection-banner">
          <span className="selection-badge">Writing for</span>
          <strong>{selectedWritePerson.fullName}</strong>
          <span>Room {selectedWritePerson.roomNo}</span>
        </div>
      ) : null}

      {viewMode === 'write' && isPeopleLoading ? <section className="state-panel">Loading people...</section> : null}
      {viewMode === 'write' && !isPeopleLoading && peopleError ? (
        <section className="state-panel state-panel-error">{peopleError}</section>
      ) : null}
      {viewMode === 'write' && !isPeopleLoading && !peopleError && people.length === 0 ? (
        <section className="state-panel">No people found yet. Add entries to `people` and come back.</section>
      ) : null}

      <AnimatePresence mode="wait">
        <motion.section
          key={viewMode}
          className="mode-content-shell"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {viewMode === 'write' ? (
            people.length > 0 ? (
              viewportMode === 'mobile' ? (
                <MobileStoryDiscovery
                  people={people}
                  selectedPersonId={selectedWritePersonId}
                  authorName={effectiveAuthorPerson?.fullName ?? ''}
                  message={message}
                  isSaving={isSaving}
                  errorMessage={writeError}
                  successMessage={writeSuccess}
                  onSelectPerson={setSelectedWritePersonId}
                  onMessageChange={setMessage}
                  onSubmit={handleCreateMemory}
                />
              ) : (
                <DesktopWriteBoard
                  people={people}
                  selectedPersonId={selectedWritePersonId}
                  authorName={effectiveAuthorPerson?.fullName ?? ''}
                  message={message}
                  isSaving={isSaving}
                  errorMessage={writeError}
                  successMessage={writeSuccess}
                  onSelectPerson={setSelectedWritePersonId}
                  onMessageChange={setMessage}
                  onSubmit={handleCreateMemory}
                />
              )
            ) : null
          ) : (
            <ReadWall
              currentPerson={selectedReadPerson}
              memories={displayedReadMemories}
              isLoading={isReadMemoriesLoading}
              errorMessage={readMemoriesError}
              sortMode={sortMode}
              onSortModeChange={setSortMode}
              isAdminPreview={isAdminPreview}
              people={people}
              selectedPersonId={selectedReadPersonId}
              onSelectPerson={setSelectedReadPersonId}
            />
          )}
        </motion.section>
      </AnimatePresence>
    </div>
  );
}

function buildPreviewMemories(people: Person[]): Memory[] {
  if (!people.length) return [];

  const starters = [
    'You made ordinary days feel cinematic.',
    'Thank you for turning chaos into laughter.',
    'Room conversations were better when you were there.',
    'Your calm energy carried more than you know.',
  ];

  const next: Memory[] = [];

  people.forEach((recipient, index) => {
    for (let i = 0; i < 3; i += 1) {
      const author = people[(index + i + 1) % people.length];
      next.push({
        id: `preview-${recipient.id}-${i}`,
        recipientId: recipient.id,
        authorId: author ? author.id : recipient.id,
        authorName: author ? author.fullName : `Classmate ${i + 1}`,
        message: starters[(index + i) % starters.length],
        createdAt: new Date(Date.now() - (index * 3 + i) * 1000 * 60 * 17).toISOString(),
      });
    }
  });

  return sortByNewest(next);
}

function sortByNewest(memories: Memory[]): Memory[] {
  return [...memories].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function shuffle(memories: Memory[]): Memory[] {
  const next = [...memories];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [next[i], next[randomIndex]] = [next[randomIndex], next[i]];
  }
  return next;
}

function readErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}
