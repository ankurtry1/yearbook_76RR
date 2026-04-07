import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  const [shuffleSeed, setShuffleSeed] = useState(() => Date.now());
  const [roulettePersonId, setRoulettePersonId] = useState<string | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const writePaneRef = useRef<HTMLElement | null>(null);
  const rouletteIntervalRef = useRef<number | null>(null);
  const rouletteTimeoutRef = useRef<number | null>(null);

  const orderedPeople = useMemo(() => {
    return shuffleBySeed(people, shuffleSeed);
  }, [people, shuffleSeed]);

  const selectedPerson = useMemo(() => {
    return people.find((person) => person.id === selectedPersonId) ?? null;
  }, [people, selectedPersonId]);

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

  useEffect(() => {
    if (!selectedPersonId) return;
    window.requestAnimationFrame(() => {
      composerRef.current?.focus();
    });
  }, [selectedPersonId]);

  useEffect(() => {
    return () => {
      clearRouletteTimers();
    };
  }, []);

  function handleSelectPerson(personId: string, shouldScrollToPane = false) {
    onSelectPerson(personId);
    if (!shouldScrollToPane) return;

    window.requestAnimationFrame(() => {
      writePaneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function handlePickSomeone() {
    if (!filteredPeople.length) return;
    clearRouletteTimers();

    const eligiblePeople =
      selectedPersonId && filteredPeople.length > 1
        ? filteredPeople.filter((person) => person.id !== selectedPersonId)
        : filteredPeople;

    if (!eligiblePeople.length) return;
    if (eligiblePeople.length === 1) {
      handleSelectPerson(eligiblePeople[0].id, true);
      return;
    }

    let ticks = 0;
    const maxTicks = Math.min(10, eligiblePeople.length * 2);

    rouletteIntervalRef.current = window.setInterval(() => {
      ticks += 1;
      const previewPick = eligiblePeople[Math.floor(Math.random() * eligiblePeople.length)];
      if (!previewPick) return;
      setRoulettePersonId(previewPick.id);

      if (ticks >= maxTicks) {
        clearRouletteTimers(false);
        const finalPick = eligiblePeople[Math.floor(Math.random() * eligiblePeople.length)] ?? previewPick;
        setRoulettePersonId(finalPick.id);
        rouletteTimeoutRef.current = window.setTimeout(() => {
          setRoulettePersonId(null);
          handleSelectPerson(finalPick.id, true);
        }, 120);
      }
    }, 70);
  }

  function handleShuffle() {
    setRoulettePersonId(null);
    clearRouletteTimers();
    setShuffleSeed(Date.now() + Math.floor(Math.random() * 1000));
  }

  function clearRouletteTimers(clearPreview = true) {
    if (rouletteIntervalRef.current !== null) {
      window.clearInterval(rouletteIntervalRef.current);
      rouletteIntervalRef.current = null;
    }
    if (rouletteTimeoutRef.current !== null) {
      window.clearTimeout(rouletteTimeoutRef.current);
      rouletteTimeoutRef.current = null;
    }
    if (clearPreview) setRoulettePersonId(null);
  }

  return (
    <main className="write-desktop-screen">
      <section className="write-toolbar-row">
        <div className="write-toolbar-copy">
          <p className="eyebrow">Write mode</p>
          <h1 className="screen-title">Whose face catches you first today?</h1>
          <span className="toolbar-stamp">Batch Board</span>
        </div>
        <div className="write-toolbar-controls">
          <input
            className="search-input"
            placeholder="Search by name or room number"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            type="button"
            className="primary-btn wall-chip-btn wall-chip-primary"
            onClick={handlePickSomeone}
            disabled={!filteredPeople.length}
          >
            Surprise me
          </button>
          <button type="button" className="ghost-chip wall-chip-btn" onClick={handleShuffle}>
            Mix the wall
          </button>
        </div>
      </section>
      <p className="search-hint write-toolbar-hint">
        {query.length === 1
          ? 'Type at least 2 characters to filter.'
          : hasNoResults
            ? 'No matches yet. Try a different name or room.'
            : hasSearch
              ? `${filteredPeople.length} faces match your search`
              : `${people.length} faces in your yearbook wall`}
      </p>

      <section className="write-desktop-layout">
        <div className="people-collage-panel">
          {hasNoResults ? (
            <div className="panel-note">No results for that search yet.</div>
          ) : (
            <div className={selectedPersonId ? 'face-wall-grid has-active' : 'face-wall-grid'}>
              {filteredPeople.map((person, index) => {
                const isActive = selectedPersonId === person.id;
                const isRoulette = roulettePersonId === person.id;
                const tileStyle = getTileStyle(person.id, index);
                const tileClass = [
                  'face-tile',
                  `tone-${tileStyle.tone}`,
                  tileStyle.hasTape ? 'taped' : '',
                  tileStyle.hasFrame ? 'framed' : '',
                  isActive ? 'active' : '',
                  isRoulette ? 'roulette' : '',
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <motion.button
                    key={person.id}
                    type="button"
                    className={tileClass}
                    onClick={() => handleSelectPerson(person.id)}
                    aria-pressed={isActive}
                    title={`${person.fullName} · Room ${person.roomNo}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: Math.min(index * 0.008, 0.1) }}
                    whileHover={{ y: -2, rotate: 0 }}
                    style={{ rotate: `${getCardRotation(person.id, index, 0.75)}deg` }}
                  >
                    <Avatar photoUrl={person.photoUrl} label={person.fullName} />
                    <div className="face-tile-meta">
                      <span className="face-tile-name">{person.fullName.split(' ')[0]}</span>
                      <span className="face-tile-room-chip">Rm {person.roomNo}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        <motion.aside
          ref={writePaneRef}
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
                  <p className="eyebrow">Writing to</p>
                  <p className="nickname">{selectedPerson.fullName}</p>
                  <p className="fullname">Room {selectedPerson.roomNo}</p>
                </div>
              </div>
              <label className="composer-label">From</label>
              <input
                className="search-input composer-author"
                value={authorName}
                readOnly
              />
              <p className="search-hint">Author is set from your signed-in profile.</p>

              <label className="composer-label">Memoir</label>
              <textarea
                ref={composerRef}
                className="composer-input write-pane-textarea note-textarea"
                placeholder={`Write to ${selectedPerson.fullName.split(' ')[0]}... start with one tiny moment only your batch would understand.`}
                value={message}
                onChange={(event) => onMessageChange(event.target.value)}
                maxLength={10000}
              />
              <div className="prompt-stack">
                <p>Which moment still makes you grin?</p>
                <p>What did they bring that no one else could?</p>
                <p>What should future-them remember on hard days?</p>
              </div>
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
              {successMessage ? (
                <p className="form-feedback form-feedback-success">Memory tucked in for {selectedPerson.fullName}.</p>
              ) : null}
            </>
          ) : (
            <p className="panel-note">Choose someone from the collage to start writing.</p>
          )}
        </motion.aside>
      </section>
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

function hashPersonId(personId: string): number {
  return personId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function getCardRotation(personId: string, index: number, spread: number): number {
  const hash = (hashPersonId(personId) + index * 17) % 13;
  if (hash === 0) return -spread;
  if (hash === 1) return spread;
  return 0;
}

function getTileStyle(personId: string, index: number): { tone: 1 | 2 | 3; hasTape: boolean; hasFrame: boolean } {
  const hash = (hashPersonId(personId) + index * 9) % 24;
  return {
    tone: (hash % 3) + 1 as 1 | 2 | 3,
    hasTape: hash === 2 || hash === 11 || hash === 19,
    hasFrame: hash === 5 || hash === 16 || hash === 22,
  };
}
