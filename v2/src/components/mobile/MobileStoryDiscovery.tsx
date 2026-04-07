import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import type { Person } from '../../lib/utils/types';
import { Avatar } from '../shared/Avatar';

type Props = {
  people: Person[];
  selectedPersonId: string | null;
  authorName: string;
  message: string;
  isSaving: boolean;
  errorMessage: string;
  successMessage: string;
  onSelectPerson: (personId: string) => void;
  onMessageChange: (value: string) => void;
  onSubmit: () => void;
};

export function MobileStoryDiscovery({
  people,
  selectedPersonId,
  authorName,
  message,
  isSaving,
  errorMessage,
  successMessage,
  onSelectPerson,
  onMessageChange,
  onSubmit,
}: Props) {
  const [query, setQuery] = useState('');
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const selectedPerson = people.find((person) => person.id === selectedPersonId) ?? null;

  const filteredPeople = useMemo(() => {
    if (query.trim().length < 2) return people;
    const normalized = query.toLowerCase();
    return people.filter((person) => {
      return (
        person.fullName.toLowerCase().includes(normalized) ||
        person.roomNo.toLowerCase().includes(normalized)
      );
    });
  }, [people, query]);

  const hasSearch = query.trim().length >= 2;
  const hasNoResults = hasSearch && filteredPeople.length === 0;

  function handleSelectPerson(personId: string) {
    onSelectPerson(personId);
    setIsComposerOpen(false);
  }

  return (
    <main className="screen-frame mobile-screen">
      <section className="hero-copy compact">
        <p className="eyebrow">Write mode</p>
        <h1 className="screen-title">Find a classmate, preview their card, then choose when to write.</h1>
        <input
          className="search-input"
          placeholder="Search by name or room"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <p className="search-hint">
          {query.length === 1
            ? 'Type one more character to filter.'
            : hasNoResults
              ? 'No matches found.'
              : hasSearch
                ? `${filteredPeople.length} people found`
                : 'Tap a person to open their detail card'}
        </p>
      </section>

      <section className="story-strip">
        {filteredPeople.map((person) => (
          <button
            key={person.id}
            type="button"
            className={selectedPersonId === person.id ? 'story-pill active' : 'story-pill'}
            onClick={() => handleSelectPerson(person.id)}
          >
            <Avatar photoUrl={person.photoUrl} label={person.fullName} small />
            <span>{person.fullName.split(' ')[0]}</span>
          </button>
        ))}
      </section>

      {hasNoResults ? (
        <p className="panel-note">No classmates match that search right now.</p>
      ) : (
        <section className="story-grid">
          {filteredPeople.map((person) => (
            <button
              key={person.id}
              type="button"
              className={selectedPersonId === person.id ? 'story-card active' : 'story-card'}
              onClick={() => handleSelectPerson(person.id)}
            >
              <Avatar photoUrl={person.photoUrl} label={person.fullName} />
              <span className="nickname">{person.fullName}</span>
              <span className="fullname">Room {person.roomNo}</span>
            </button>
          ))}
        </section>
      )}

      <AnimatePresence mode="wait">
        {selectedPerson ? (
          <motion.section
            key={selectedPerson.id}
            className="mobile-focus-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mobile-focus-header">
              <Avatar photoUrl={selectedPerson.photoUrl} label={selectedPerson.fullName} small />
              <div>
                <p className="nickname">{selectedPerson.fullName}</p>
                <p className="fullname">Room {selectedPerson.roomNo}</p>
              </div>
            </div>
            <p className="mobile-focus-text">Ready to leave something thoughtful? Open the writing sheet when you are.</p>
            <button type="button" className="primary-btn" onClick={() => setIsComposerOpen(true)}>
              Write memoir
            </button>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isComposerOpen && selectedPerson ? (
          <motion.div
            className="bottom-sheet-shell"
            onClick={() => setIsComposerOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bottom-sheet"
              onClick={(event) => event.stopPropagation()}
              initial={{ y: 220 }}
              animate={{ y: 0 }}
              exit={{ y: 220 }}
              transition={{ type: 'spring', damping: 24, stiffness: 260 }}
            >
              <div className="sheet-handle" />
              <div className="sheet-header">
                <Avatar photoUrl={selectedPerson.photoUrl} label={selectedPerson.fullName} small />
                <div>
                  <div className="nickname">{selectedPerson.fullName}</div>
                  <div className="fullname">Room {selectedPerson.roomNo}</div>
                </div>
              </div>
              <input
                className="search-input composer-author"
                value={authorName}
                readOnly
              />
              <p className="search-hint">Author is set from your signed-in profile.</p>
              <textarea
                className="composer-input"
                placeholder="Write the memoir here..."
                value={message}
                onChange={(event) => onMessageChange(event.target.value)}
                maxLength={10000}
              />
              <div className="sheet-actions">
                <button type="button" className="ghost-chip" onClick={() => setIsComposerOpen(false)}>
                  Close
                </button>
                <button type="button" className="primary-btn" onClick={onSubmit} disabled={isSaving}>
                  {isSaving ? 'Sending...' : 'Send memoir'}
                </button>
              </div>
              {errorMessage ? <p className="form-feedback form-feedback-error">{errorMessage}</p> : null}
              {successMessage ? <p className="form-feedback form-feedback-success">{successMessage}</p> : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
