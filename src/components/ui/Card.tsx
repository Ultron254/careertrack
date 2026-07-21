import clsx from 'clsx';
import type { HTMLAttributes } from 'react';
import styles from './Card.module.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'default' | 'roomy';
}

export function Card({ padding = 'default', className, ...rest }: CardProps) {
  return (
    <div
      className={clsx(
        styles.card,
        padding === 'default' && styles.padded,
        padding === 'roomy' && styles.roomy,
        className,
      )}
      {...rest}
    />
  );
}
