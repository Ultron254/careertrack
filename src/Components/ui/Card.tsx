import clsx from 'clsx';
import type { HTMLAttributes } from 'react';
import styles from './Card.module.css';

interface CardProps extends HTMLAttributes<HTMLElement> {
  padding?: 'none' | 'default' | 'roomy';
  // Render as a native button when the whole card is a single action.
  as?: 'div' | 'button';
}

export function Card({ padding = 'default', className, as = 'div', ...rest }: CardProps) {
  const Component = as;
  return (
    <Component
      className={clsx(
        styles.card,
        padding === 'default' && styles.padded,
        padding === 'roomy' && styles.roomy,
        className,
      )}
      {...(as === 'button' ? { type: 'button' } : {})}
      {...rest}
    />
  );
}
