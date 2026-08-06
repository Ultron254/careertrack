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

// The parent agency device: an oxygen atom, a ring with a nucleus, tying the
// mark to the Oxygene name. Inherits its colour from the text unless overridden.
export function OxygeneMark({ size = 18, tone }: { size?: number; tone?: string }) {
  const colour = tone ?? 'currentColor';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke={colour} strokeWidth="1.8" opacity="0.55" />
      <circle cx="12" cy="12" r="3.4" fill={colour} />
      <circle cx="20" cy="7.5" r="1.5" fill={colour} opacity="0.55" />
    </svg>
  );
}
