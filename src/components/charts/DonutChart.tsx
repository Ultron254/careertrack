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
}

// Hand built to match the design exactly and avoid a charting dependency. The
// ring is a set of stroked circles offset around the circumference.
const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DonutChart({ segments, size = 108, thickness = 20 }: DonutChartProps) {
  let accumulated = 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 140 140"
      style={{ transform: 'rotate(-90deg)', flex: 'none' }}
      role="img"
      aria-hidden="true"
    >
      <circle cx="70" cy="70" r={RADIUS} fill="none" stroke="var(--surface-alt)" strokeWidth={thickness} />
      {segments.map((segment, index) => {
        const fraction = segment.share / 100;
        const dash = `${fraction * CIRCUMFERENCE} ${CIRCUMFERENCE - fraction * CIRCUMFERENCE}`;
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
          />
        );
      })}
    </svg>
  );
}
