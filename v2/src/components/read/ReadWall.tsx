import { useState } from 'react';
import { Avatar } from '../shared/Avatar';
import type { Memoir, SortMode } from '../../lib/utils/types';

type Props = { memoirs: Memoir[]; sortMode: SortMode; setSortMode: (mode: SortMode) => void; };

const REACTION_LABELS = [
  { key: 'love', emoji: '❤️', label: 'Loved it' },
  { key: 'laugh', emoji: '😂', label: 'Hilarious' },
  { key: 'emotional', emoji: '🥹', label: 'Emotional' },
  { key: 'anchored', emoji: '🫡', label: 'Anchored' },
] as const;

export function ReadWall({ memoirs, sortMode, setSortMode }: Props) {
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  return (
    <main className="screen-frame">
      <section className="hero-copy">
        <p className="eyebrow">Read mode</p>
        <h1 className="screen-title">A playful wall of memoir cards, shuffled first because predictability is overrated.</h1>
        <div className="sort-row">{(['random', 'unread', 'newest'] as SortMode[]).map((mode) => <button key={mode} className={sortMode === mode ? 'ghost-chip active' : 'ghost-chip'} onClick={() => setSortMode(mode)}>{mode}</button>)}</div>
      </section>
      <section className="read-wall">
        {memoirs.map((memoir, index) => {
          const isOpen = flipped[memoir.id];
          return (
            <article key={memoir.id} className={isOpen ? 'memoir-flip-card flipped' : 'memoir-flip-card'} style={{ transform: `rotate(${(index % 5) - 2}deg)` }} onClick={() => setFlipped((prev) => ({ ...prev, [memoir.id]: !prev[memoir.id] }))}>
              <div className="memoir-flip-inner">
                <div className="memoir-front">
                  <Avatar photoUrl={memoir.senderPhotoUrl} label={memoir.senderDisplayName} anonymous={memoir.isAnonymous} />
                  <div className="memoir-front-copy"><span className="nickname">{memoir.isAnonymous ? 'Anonymous' : memoir.senderDisplayName}</span><span className="fullname">{memoir.isRead ? 'Seen memoir' : 'Unread memoir'}</span></div>
                </div>
                <div className="memoir-back">
                  <div className="memoir-back-header">
                    <Avatar photoUrl={memoir.senderPhotoUrl} label={memoir.senderDisplayName} anonymous={memoir.isAnonymous} small />
                    <div><div className="nickname">{memoir.isAnonymous ? 'Anonymous' : memoir.senderDisplayName}</div><div className="fullname">Tap again to close</div></div>
                  </div>
                  <p className="memoir-text">{memoir.text}</p>
                  <div className="reaction-row">{REACTION_LABELS.map((reaction) => <button key={reaction.key} className="reaction-pill"><span>{reaction.emoji}</span><span>{memoir.reactions[reaction.key]}</span></button>)}</div>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
