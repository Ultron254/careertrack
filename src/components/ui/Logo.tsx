interface LogoProps {
  size?: number;
  monochrome?: boolean;
}

// The CareerTrack mark: three rising bars and a gold dot.
export function LogoMark({ size = 20, monochrome = false }: LogoProps) {
  const bar = monochrome ? 'var(--surface)' : undefined;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="4" y="28" width="9" height="16" rx="4" fill={bar ?? 'var(--orange)'} />
      <rect x="19.5" y="19" width="9" height="25" rx="4" fill={bar ?? 'var(--blue)'} />
      <rect x="35" y="9" width="9" height="35" rx="4" fill={bar ?? 'var(--teal)'} />
      <circle cx="39.5" cy="5" r="4.4" fill="var(--gold)" />
    </svg>
  );
}
