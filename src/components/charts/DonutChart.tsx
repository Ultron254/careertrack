import type { Accent } from '@/api/schemas/dashboard';
import { accentColour } from '@/components/ui/accent';

interface Segment {
  share: number;
  accent: Accent;
}

interface DonutChartProps {
  segments: Segment[];
  size?: number;
  thickness?: number;
  centerValue?: string;
  centerLabel?: string;
}

// Hand built to avoid a charting dependency. The ring is a set of stroked arcs
// offset around the circumference, separated by a small gap with rounded ends
// so the segments read as distinct rather than one continuous band.
const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DonutChart({
  segments,
  size = 116,
  thickness = 16,
  centerValue,
  centerLabel,
}: DonutChartProps) {
  const gap = thickness + 6;
  const visible = segments.filter((segment) => segment.share > 0);
  let accumulated = 0;

  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 140 140"
        style={{ transform: 'rotate(-90deg)', display: 'block' }}
        role="img"
        aria-hidden="true"
      >
        <circle cx="70" cy="70" r={RADIUS} fill="none" stroke="var(--surface-alt)" strokeWidth={thickness} />
        {visible.map((segment, index) => {
          const fraction = segment.share / 100;
          const length = Math.max(3, fraction * CIRCUMFERENCE - gap);
          const dash = `${length} ${CIRCUMFERENCE - length}`;
          const offset = -accumulated * CIRCUMFERENCE;
          accumulated += fraction;
          return (
            <circle
              key={index}
              cx="70"
              cy="70"
              r={RADIUS}
              fill="none"
              stroke={accentColour[segment.accent]}
              strokeWidth={thickness}
              strokeDasharray={dash}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      {(centerValue || centerLabel) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          {centerValue && (
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: Math.round(size * 0.24),
                lineHeight: 1,
                color: 'var(--ink)',
              }}
            >
              {centerValue}
            </span>
          )}
          {centerLabel && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{centerLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
