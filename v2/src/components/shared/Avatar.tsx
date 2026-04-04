type Props = { photoUrl?: string; label: string; anonymous?: boolean; small?: boolean; };
export function Avatar({ photoUrl, label, anonymous = false, small = false }: Props) {
  const className = small ? 'avatar avatar-small' : 'avatar';
  if (anonymous || !photoUrl) return <div className={`${className} avatar-fallback`}>{anonymous ? '?' : label.slice(0, 2).toUpperCase()}</div>;
  return <img className={className} src={photoUrl} alt={label} />;
}
