import { motion } from 'framer-motion';
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

export function DesktopWriteBoard({
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

  const selectedPerson = useMemo(() => {
    return people.find((person) => person.id === selectedPersonId) ?? null;
  }, [people, selectedPersonId]);

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

  return (
    <main className="write-desktop-screen">
      <section className="write-search-row">
        <div>
          <p className="eyebrow">Write mode</p>
          <h1 className="screen-title">Pick a face, then write in a pane that feels like paper.</h1>
        </div>
        <div className="write-search-box">
          <input
            className="search-input"
            placeholder="Search by name or room number"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <p className="search-hint">
            {query.length === 1
              ? 'Type at least 2 characters to filter.'
              : hasNoResults
                ? 'No matches yet. Try a different name or room.'
                : hasSearch
                  ? `${filteredPeople.length} people found`
                  : `${people.length} people in this yearbook`}
          </p>
        </div>
      </section>

      <section className="write-desktop-layout">
        <div className="people-collage-panel">
          {hasNoResults ? (
            <div className="panel-note">No results for that search yet.</div>
          ) : (
            <div className="people-collage-grid">
              {filteredPeople.map((person, index) => {
                const isActive = selectedPersonId === person.id;

                return (
                  <motion.button
                    key={person.id}
                    type="button"
                    className={isActive ? 'person-card person-card-compact active' : 'person-card person-card-compact'}
                    onClick={() => onSelectPerson(person.id)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.12) }}
                    whileHover={{ y: -4, rotate: 0 }}
                    style={{ rotate: `${(index % 5) - 2}deg` }}
                  >
                    <div className="tape tape-left" />
                    <Avatar photoUrl={person.photoUrl} label={person.fullName} />
                    <div className="person-meta">
                      <span className="nickname">{person.fullName}</span>
                      <span className="fullname">Room {person.roomNo}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        <motion.aside
          key={selectedPerson?.id ?? 'none'}
          className="write-pane"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          {selectedPerson ? (
            <>
              <div className="write-pane-header">
                <Avatar photoUrl={selectedPerson.photoUrl} label={selectedPerson.fullName} small />
                <div>
                  <p className="nickname">{selectedPerson.fullName}</p>
                  <p className="fullname">Room {selectedPerson.roomNo}</p>
                </div>
              </div>
              <label className="composer-label">Author name</label>
              <input
                className="search-input composer-author"
                value={authorName}
                readOnly
              />
              <p className="search-hint">Author is set from your signed-in profile.</p>

              <label className="composer-label">Memoir</label>
              <textarea
                className="composer-input write-pane-textarea"
                placeholder="Write the memory they'll come back to years from now."
                value={message}
                onChange={(event) => onMessageChange(event.target.value)}
                maxLength={10000}
              />
              <div className="composer-row">
                <button
                  type="button"
                  className="ghost-chip"
                  onClick={() =>
                    onMessageChange(`${message}${message ? ' ' : ''}Thank you for always...`)
                  }
                >
                  Prompt
                </button>
                <button type="button" className="primary-btn" onClick={onSubmit} disabled={isSaving}>
                  {isSaving ? 'Sending...' : 'Send memoir'}
                </button>
              </div>
              {errorMessage ? <p className="form-feedback form-feedback-error">{errorMessage}</p> : null}
              {successMessage ? <p className="form-feedback form-feedback-success">{successMessage}</p> : null}
            </>
          ) : (
            <p className="panel-note">Choose someone from the collage to start writing.</p>
          )}
        </motion.aside>
      </section>
    </main>
  );
}
