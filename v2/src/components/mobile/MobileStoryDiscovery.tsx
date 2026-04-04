import { useMemo, useState } from 'react';
import { Avatar } from '../shared/Avatar';
import type { Person } from '../../lib/utils/types';

type Props = { people: Person[] };

export function MobileStoryDiscovery({ people }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Person | null>(null);
  const [memoir, setMemoir] = useState('');
  const filtered = useMemo(() => {
    if (query.trim().length < 2) return people;
    const q = query.toLowerCase();
    return people.filter((person) => person.nickname.toLowerCase().includes(q) || person.fullName.toLowerCase().includes(q));
  }, [people, query]);

  return (
    <main className="screen-frame mobile-screen">
      <section className="hero-copy compact">
        <p className="eyebrow">Write mode</p>
        <h1 className="screen-title">A story-style people tray, because 80 faces deserve better than a spreadsheet.</h1>
        <input className="search-input" placeholder="Search name" value={query} onChange={(e) => setQuery(e.target.value)} />
      </section>
      <section className="story-strip">
        {filtered.map((person) => (
          <button key={person.id} className="story-pill" onClick={() => setSelected(person)}>
            <Avatar photoUrl={person.photoUrl} label={person.nickname} small />
            <span>{person.nickname}</span>
          </button>
        ))}
      </section>
      <section className="story-grid">
        {filtered.map((person) => (
          <button key={person.id} className="story-card" onClick={() => setSelected(person)}>
            <Avatar photoUrl={person.photoUrl} label={person.nickname} />
            <span className="nickname">{person.nickname}</span>
            <span className="fullname">{person.fullName}</span>
          </button>
        ))}
      </section>
      {selected && (
        <div className="bottom-sheet-shell" onClick={() => setSelected(null)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-header">
              <Avatar photoUrl={selected.photoUrl} label={selected.nickname} small />
              <div><div className="nickname">{selected.nickname}</div><div className="fullname">{selected.fullName}</div></div>
            </div>
            <textarea className="composer-input" placeholder="Write the memoir here..." value={memoir} onChange={(e) => setMemoir(e.target.value)} maxLength={10000} />
            <button className="primary-btn">Send memoir</button>
          </div>
        </div>
      )}
    </main>
  );
}
