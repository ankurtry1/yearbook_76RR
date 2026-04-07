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
  const [shuffleSeed, setShuffleSeed] = useState(() => Date.now());

  const orderedPeople = useMemo(() => {
    return shuffleBySeed(people, shuffleSeed);
  }, [people, shuffleSeed]);

  const selectedPerson = orderedPeople.find((person) => person.id === selectedPersonId) ?? null;

  const filteredPeople = useMemo(() => {
    if (query.trim().length < 2) return orderedPeople;
    const normalized = query.toLowerCase();
    return orderedPeople.filter((person) => {
      return (
        person.fullName.toLowerCase().includes(normalized) ||
        person.roomNo.toLowerCase().includes(normalized)
      );
    });
  }, [orderedPeople, query]);

  const hasSearch = query.trim().length >= 2;
  const hasNoResults = hasSearch && filteredPeople.length === 0;

  function handleSelectPerson(personId: string) {
    if (selectedPersonId === personId) {
      setIsComposerOpen(true);
      return;
    }

    onSelectPerson(personId);
    setIsComposerOpen(false);
  }

  function handlePickSomeone() {
    if (!filteredPeople.length) return;
    const eligiblePeople =
      selectedPersonId && filteredPeople.length > 1
        ? filteredPeople.filter((person) => person.id !== selectedPersonId)
        : filteredPeople;
    const randomPick = eligiblePeople[Math.floor(Math.random() * eligiblePeople.length)];
    if (!randomPick) return;
    handleSelectPerson(randomPick.id);
  }

  function handleShuffle() {
    setShuffleSeed(Date.now() + Math.floor(Math.random() * 1000));
  }

  return (
    <main className="screen-frame mobile-screen">
      <section className="mobile-write-toolbar">
        <div className="mobile-write-topline">
          <p className="eyebrow">Write mode</p>
          <p className="mobile-write-helper">Choose a face, then write from the heart.</p>
          {selectedPerson ? (
            <span className="mobile-selected-chip">For {selectedPerson.fullName.split(' ')[0]}</span>
          ) : null}
        </div>
        <div className="mobile-write-controls-row">
          <div className="mobile-search-shell">
            <input
              className="search-input mobile-search-input"
              placeholder="Find by name or room"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="mobile-action-row">
            <button type="button" className="primary-btn mobile-action-chip" onClick={handlePickSomeone} disabled={!filteredPeople.length}>
              Surprise
            </button>
            <button type="button" className="ghost-chip mobile-action-chip" onClick={handleShuffle}>
              Mix
            </button>
          </div>
        </div>
        <p className="search-hint">
          {query.length === 1
            ? 'Type one more character to filter.'
            : hasNoResults
              ? 'No matches found.'
              : hasSearch
                ? `${filteredPeople.length} faces found`
                : `${people.length} faces ready`}
        </p>
      </section>

      {selectedPerson ? (
        <motion.section
          key={selectedPerson.id}
          className="mobile-selected-stage"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <div className="mobile-selected-stage-head">
            <Avatar photoUrl={selectedPerson.photoUrl} label={selectedPerson.fullName} small />
            <div>
              <p className="nickname">{selectedPerson.fullName}</p>
              <p className="fullname">Room {selectedPerson.roomNo}</p>
            </div>
          </div>
          <p className="mobile-selected-stage-copy">
            Capture one memory they should carry into the next chapter.
          </p>
          <button type="button" className="primary-btn mobile-write-cta" onClick={() => setIsComposerOpen(true)}>
            Your memoir for {selectedPerson.fullName.split(' ')[0]}
          </button>
        </motion.section>
      ) : null}

      {hasNoResults ? (
        <p className="panel-note">No classmates match that search right now.</p>
      ) : (
        <section className={selectedPersonId ? 'mobile-face-collage has-active' : 'mobile-face-collage'}>
          {filteredPeople.map((person, index) => {
            const style = getMobileTileStyle(person.id, index);
            const className = [
              'mobile-face-card',
              `tone-${style.tone}`,
              style.hasTape ? 'taped' : '',
              style.hasFrame ? 'framed' : '',
              selectedPersonId === person.id ? 'active' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
            <button
              key={person.id}
              type="button"
              className={className}
              onClick={() => handleSelectPerson(person.id)}
              title={`${person.fullName} · Room ${person.roomNo}`}
            >
              <Avatar photoUrl={person.photoUrl} label={person.fullName} small />
              <span className="nickname">{person.fullName.split(' ')[0]}</span>
            </button>
            );
          })}
        </section>
      )}

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
                className="composer-input mobile-composer-input"
                placeholder={`Write a memory for ${selectedPerson.fullName.split(' ')[0]}...`}
                value={message}
                onChange={(event) => onMessageChange(event.target.value)}
                maxLength={10000}
              />
              <p className="search-hint">What should they remember about this chapter of life?</p>
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

function shuffleBySeed(people: Person[], seed: number): Person[] {
  if (people.length <= 1) return people;

  const next = [...people];
  const random = seededRandom(seed);

  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    [next[index], next[randomIndex]] = [next[randomIndex], next[index]];
  }

  return next;
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashValue(value: string): number {
  return value.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function getMobileTileStyle(personId: string, index: number): { tone: 1 | 2 | 3; hasTape: boolean; hasFrame: boolean } {
  const hash = (hashValue(personId) + index * 13) % 17;
  return {
    tone: ((hash % 3) + 1) as 1 | 2 | 3,
    hasTape: hash === 2 || hash === 9,
    hasFrame: hash === 4 || hash === 12,
  };
}
