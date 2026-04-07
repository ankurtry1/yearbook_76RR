import { useMemo, useState } from 'react';

type Props = {
  photoUrl?: string | null;
  label: string;
  anonymous?: boolean;
  small?: boolean;
};

const PAPER_TINTS: Array<[string, string]> = [
  ['#f0dfbf', '#ead2a8'],
  ['#ebd8cb', '#e4c3b2'],
  ['#e5dbc6', '#d8c6a8'],
  ['#d8e3d2', '#c5d6bb'],
  ['#ded7eb', '#cfc5df'],
];

export function Avatar({ photoUrl, label, anonymous = false, small = false }: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const className = small ? 'avatar avatar-small' : 'avatar';
  const initials = getInitials(label);

  const tint = useMemo(() => {
    const seed = label.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return PAPER_TINTS[seed % PAPER_TINTS.length];
  }, [label]);

  if (anonymous || !photoUrl || imageFailed) {
    const fallbackLabel = anonymous ? '?' : initials;
    return (
      <div
        className={`${className} avatar-fallback avatar-paper`}
        style={{ background: `linear-gradient(135deg, ${tint[0]}, ${tint[1]})` }}
      >
        {fallbackLabel}
      </div>
    );
  }

  return (
    <img
      className={className}
      src={photoUrl}
      alt={label}
      loading="lazy"
      onError={() => setImageFailed(true)}
    />
  );
}

function getInitials(label: string): string {
  const tokens = label
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!tokens.length) return '??';
  if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
  return `${tokens[0][0]}${tokens[tokens.length - 1][0]}`.toUpperCase();
}
