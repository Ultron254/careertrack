import { useState } from 'react';
import type { Accent } from '@/api/schemas/dashboard';
import { accentColour } from '@/components/ui/accent';

interface Segment {
  share: number;
  accent: Accent;
  label?: string;
  detail?: string;
}

interface DonutChartProps {
  segments: Segment[];
  size?: number;
  thickness?: number;
  centerValue?: string;
  centerLabel?: string;
  onSegmentClick?: (index: number) => void;
}

// Hand built to avoid a charting dependency. The ring is a set of stroked arcs
// offset around the circumference, separated by a small gap with rounded ends
// so the segments read as distinct rather than one continuous band. Hovering a
// segment lifts it and shows its share in the centre; clicking drills in.
const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DonutChart({
  segments,
  size = 116,
  thickness = 16,
  centerValue,
  centerLabel,
  onSegmentClick,
}: DonutChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const gap = thickness + 6;
  const clickable = !!onSegmentClick;

  // Map original indices through the visible filter so click/hover stay aligned.
  const visible = segments
    .map((segment, index) => ({ segment, index }))
    .filter((entry) => entry.segment.share > 0);
  let accumulated = 0;

  const active = hovered !== null ? segments[hovered] : null;
  const showValue = active ? `${active.share}%` : centerValue;
  const showLabel = active ? active.label ?? centerLabel : centerLabel;

  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 140 140"
        style={{ transform: 'rotate(-90deg)', display: 'block', overflow: 'visible' }}
        role="img"
        aria-hidden="true"
      >
        <circle cx="70" cy="70" r={RADIUS} fill="none" stroke="var(--surface-alt)" strokeWidth={thickness} />
        {visible.map(({ segment, index }) => {
          const fraction = segment.share / 100;
          const length = Math.max(3, fraction * CIRCUMFERENCE - gap);
          const dash = `${length} ${CIRCUMFERENCE - length}`;
          const offset = -accumulated * CIRCUMFERENCE;
          accumulated += fraction;
          const isHovered = hovered === index;
          const dimmed = hovered !== null && !isHovered;
          return (
            <circle
              key={index}
              cx="70"
              cy="70"
              r={RADIUS}
              fill="none"
              stroke={accentColour[segment.accent]}
              strokeWidth={isHovered ? thickness + 4 : thickness}
              strokeDasharray={dash}
              strokeDashoffset={offset}
              strokeLinecap="round"
              opacity={dimmed ? 0.45 : 1}
              style={{ cursor: clickable ? 'pointer' : 'default', transition: 'opacity 140ms, stroke-width 140ms' }}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered((current) => (current === index ? null : current))}
              onClick={clickable ? () => onSegmentClick?.(index) : undefined}
            >
              {(segment.detail || segment.label) && <title>{segment.detail ?? segment.label}</title>}
            </circle>
          );
        })}
      </svg>
      {(showValue || showLabel) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            pointerEvents: 'none',
          }}
        >
          {showValue && (
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: Math.round(size * 0.24),
                lineHeight: 1,
                color: active ? accentColour[active.accent] : 'var(--ink)',
                transition: 'color 140ms',
              }}
            >
              {showValue}
            </span>
          )}
          {showLabel && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{showLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
