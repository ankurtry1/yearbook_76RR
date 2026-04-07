import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import type { Memory, Person, SortMode } from '../../lib/utils/types';
import { Avatar } from '../shared/Avatar';

type Props = {
  currentPerson: Person | null;
  memories: Memory[];
  isLoading: boolean;
  errorMessage: string;
  sortMode: SortMode;
  onSortModeChange: (mode: SortMode) => void;
  isAdminPreview?: boolean;
  people?: Person[];
  selectedPersonId?: string | null;
  onSelectPerson?: (personId: string) => void;
};

export function ReadWall({
  currentPerson,
  memories,
  isLoading,
  errorMessage,
  sortMode,
  onSortModeChange,
  isAdminPreview = false,
  people = [],
  selectedPersonId = null,
  onSelectPerson,
}: Props) {
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});

  const featuredId = useMemo(() => {
    if (!memories.length) return null;
    return [...memories].sort((a, b) => b.message.length - a.message.length)[0].id;
  }, [memories]);

  return (
    <main className="screen-frame">
      <section className="hero-copy">
        <p className="eyebrow">Read mode</p>
        <h1 className="screen-title">
          {isAdminPreview ? 'Preview any memoir wall.' : 'Your private memoir wall.'}
        </h1>
        <p className="screen-subtitle">
          {isAdminPreview
            ? 'Admin preview lets you switch recipients locally for QA.'
            : 'Only memories written for you appear here.'}
        </p>
        {currentPerson ? (
          <div className="viewer-chip">
            <Avatar photoUrl={currentPerson.photoUrl} label={currentPerson.fullName} small />
            <div>
              <p className="nickname">{currentPerson.fullName}</p>
              <p className="fullname">Room {currentPerson.roomNo}</p>
            </div>
          </div>
        ) : null}
        <div className="sort-row">
          {(['newest', 'random'] as SortMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className={sortMode === mode ? 'ghost-chip active' : 'ghost-chip'}
              onClick={() => onSortModeChange(mode)}
            >
              {mode}
            </button>
          ))}
        </div>
      </section>

      {isAdminPreview ? (
        <section className="story-strip">
          {people.map((person) => (
            <button
              key={person.id}
              type="button"
              className={selectedPersonId === person.id ? 'story-pill active' : 'story-pill'}
              onClick={() => onSelectPerson?.(person.id)}
            >
              <Avatar photoUrl={person.photoUrl} label={person.fullName} small />
              <span>{person.fullName.split(' ')[0]}</span>
            </button>
          ))}
        </section>
      ) : null}

      {!currentPerson && isAdminPreview ? (
        <p className="panel-note">Select someone to preview their wall.</p>
      ) : null}

      {isLoading ? <p className="panel-note">Loading memories...</p> : null}
      {errorMessage ? <p className="panel-note panel-note-error">{errorMessage}</p> : null}
      {!isLoading && !errorMessage && currentPerson && memories.length === 0 ? (
        <div className="empty-memory-note">
          <p>No one has written for them yet. Be the first.</p>
        </div>
      ) : null}

      {!isLoading && !errorMessage && memories.length > 0 ? (
        <section className={memories.length < 4 ? 'read-wall-upgraded read-wall-tight' : 'read-wall-upgraded'}>
          {memories.map((memory, index) => {
            const key = String(memory.id);
            const isOpen = flipped[key] ?? false;
            const messageFirst = getMessageFirst(memory, index);
            const isFeatured = memory.id === featuredId || index === 0;
            const sizeClass = getSizeClass(memory.message, isFeatured);
            const showMessageFace = messageFirst ? !isOpen : isOpen;

            return (
              <motion.article
                key={key}
                className={`memoir-card-shell ${sizeClass} ${isFeatured ? 'featured' : ''}`}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.28, delay: Math.min(index * 0.03, 0.18) }}
                whileHover={{ y: -4, rotate: 0 }}
                onClick={() => setFlipped((prev) => ({ ...prev, [key]: !isOpen }))}
              >
                {isFeatured ? <span className="featured-tag">Featured</span> : null}
                {showMessageFace ? (
                  <div className="memoir-face memoir-face-message">
                    <p className="memoir-text">{memory.message}</p>
                    <p className="fullname">from {memory.authorName}</p>
                  </div>
                ) : (
                  <div className="memoir-face memoir-face-author">
                    <div className="memoir-back-header">
                      <Avatar label={memory.authorName} small />
                      <div>
                        <div className="nickname">{memory.authorName}</div>
                        <div className="fullname">{formatDate(memory.createdAt)}</div>
                      </div>
                    </div>
                    <p className="memoir-preview">{truncate(memory.message, 110)}</p>
                    <p className="fullname">Tap to read full message</p>
                  </div>
                )}
              </motion.article>
            );
          })}
        </section>
      ) : null}
    </main>
  );
}

function getMessageFirst(memory: Memory, index: number): boolean {
  const text = `${memory.id}-${memory.authorName}-${index}`;
  let sum = 0;
  for (let i = 0; i < text.length; i += 1) sum += text.charCodeAt(i);
  return sum % 2 === 0;
}

function getSizeClass(message: string, isFeatured: boolean): string {
  if (isFeatured) return 'size-featured';
  if (message.length > 240) return 'size-tall';
  if (message.length < 90) return 'size-compact';
  return 'size-regular';
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trim()}...`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
