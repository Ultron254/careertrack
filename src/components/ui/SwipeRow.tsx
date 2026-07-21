import { useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { Icon } from '@/components/icons/Icon';
import type { IconName } from '@/components/icons/iconPaths';
import styles from './SwipeRow.module.css';

export interface SwipeAction {
  label: string;
  icon: IconName;
  tone?: 'default' | 'danger';
  onAction: () => void;
  disabled?: boolean;
}

interface SwipeRowProps {
  actions: SwipeAction[];
  children: ReactNode;
  className?: string;
}

const ACTION_WIDTH = 84;

// Touch driven reveal for mobile list rows. A pointer never triggers it, so the
// desktop experience is untouched and the row keeps its normal click behaviour.
export function SwipeRow({ actions, children, className }: SwipeRowProps) {
  const revealWidth = actions.length * ACTION_WIDTH;
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const startOffset = useRef(0);
  const dragging = useRef(false);

  const onTouchStart = (event: React.TouchEvent) => {
    startX.current = event.touches[0].clientX;
    startOffset.current = offset;
    dragging.current = true;
  };

  const onTouchMove = (event: React.TouchEvent) => {
    if (!dragging.current) return;
    const delta = event.touches[0].clientX - startX.current;
    const next = Math.min(0, Math.max(-revealWidth, startOffset.current + delta));
    setOffset(next);
  };

  const onTouchEnd = () => {
    dragging.current = false;
    setOffset(offset < -revealWidth / 2 ? -revealWidth : 0);
  };

  const runAction = (action: SwipeAction) => {
    setOffset(0);
    if (!action.disabled) action.onAction();
  };

  return (
    <div className={clsx(styles.wrap, className)}>
      <div className={styles.actions} aria-hidden={offset === 0}>
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            className={clsx(styles.action, action.tone === 'danger' && styles.danger)}
            style={{ width: ACTION_WIDTH }}
            onClick={() => runAction(action)}
            disabled={action.disabled}
            tabIndex={offset === 0 ? -1 : 0}
          >
            <Icon name={action.icon} size={18} />
            {action.label}
          </button>
        ))}
      </div>
      <div
        className={styles.foreground}
        style={{ transform: `translateX(${offset}px)`, transition: dragging.current ? 'none' : undefined }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
