import clsx from 'clsx';
import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ink' | 'teal' | 'surface' | 'ghost' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  shape?: 'pill' | 'rounded';
  block?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  shape = 'pill',
  block = false,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        styles.button,
        styles[variant],
        styles[size],
        shape === 'rounded' && styles.rounded,
        block && styles.block,
        className,
      )}
      {...rest}
    />
  );
}
