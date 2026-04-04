import { useMemo, useState } from 'react';
import { Avatar } from '../shared/Avatar';
import type { Person } from '../../lib/utils/types';

type Props = { people: Person[] };

export function DesktopWriteBoard({ people }: Props) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [memoir, setMemoir] = useState('');
  const filtered = useMemo(() => {
    if (query.trim().length < 2) return people;
    const q = query.toLowerCase();
    return people.filter((person) => person.nickname.toLowerCase().includes(q) || person.fullName.toLowerCase().includes(q));
  }, [people, query]);

  return (
    <main className="screen-frame">
      <section className="hero-copy">
        <p className="eyebrow">Write mode</p>
        <h1 className="screen-title">Pinned memories, loose edges, and one person at a time.</h1>
        <p className="screen-subtitle">Desktop uses a scrapbook cloud. Search after 2 characters, or just drift around and tap a face.</p>
        <input className="search-input" placeholder="Search nickname or name" value={query} onChange={(e) => setQuery(e.target.value)} />
      </section>
      <section className="scrapbook-cloud">
        {filtered.map((person, index) => {
          const active = selectedId === person.id;
          return (
            <article key={person.id} className={active ? 'person-card active' : 'person-card'} style={{ transform: `translate(${(index % 4) * 6}px, ${(index % 3) * 4}px) rotate(${(index % 5) - 2}deg)`, zIndex: active ? 4 : 1 }} onClick={() => setSelectedId(person.id)}>
              <div className="tape tape-left" /><div className="tape tape-right" />
              <Avatar photoUrl={person.photoUrl} label={person.nickname} />
              <div className="person-meta"><span className="nickname">{person.nickname}</span><span className="fullname">{person.fullName}</span></div>
              {active && (
                <div className="inline-composer" onClick={(e) => e.stopPropagation()}>
                  <label className="composer-label">Write for {person.nickname}</label>
                  <textarea className="composer-input" placeholder="Write the thing they'll secretly re-read 4 times." value={memoir} onChange={(e) => setMemoir(e.target.value)} maxLength={10000} />
                  <div className="composer-row">
                    <button className="ghost-chip" onClick={() => setMemoir((v) => `${v}${v ? ' ' : ''}funniest moment:`)}>Prompt</button>
                    <button className="primary-btn">Send memoir</button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}
