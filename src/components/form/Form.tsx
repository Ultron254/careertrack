import type { ReactNode, SelectHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Icon } from '@/components/icons/Icon';
import styles from './form.module.css';

// Small primitives shared by every form modal. They cover the header, the
// labelled field with inline error, the styled controls and the footer
// actions, so features stop re-implementing the same markup and CSS.

export function ModalHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle?: ReactNode;
  onClose: () => void;
}) {
  return (
    <>
      <div className={styles.head}>
        <h2 className={styles.title}>{title}</h2>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
          <Icon name="close" size={16} />
        </button>
      </div>
      {subtitle && <p className={styles.sub}>{subtitle}</p>}
    </>
  );
}

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  // Shown only when non-empty; pass the message once the field is touched.
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
      {error && <span className={styles.fieldError}>{error}</span>}
    </label>
  );
}

// Two fields side by side, stacking on narrow screens.
export function FieldRow({ children }: { children: ReactNode }) {
  return <div className={styles.fieldRow}>{children}</div>;
}

export function TextInput({
  invalid,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input className={styles.input} data-invalid={invalid} aria-invalid={invalid} {...rest} />;
}

export function TextArea({
  invalid,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea className={styles.input} data-invalid={invalid} aria-invalid={invalid} {...rest} />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={styles.input} {...props} />;
}

export function FormActions({
  submitLabel,
  onCancel,
  disabled,
  busy,
}: {
  submitLabel: string;
  onCancel: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <div className={styles.actions}>
      <button type="button" className={styles.ghost} onClick={onCancel}>
        Cancel
      </button>
      <button type="submit" className={styles.primary} disabled={disabled || busy}>
        {busy ? 'Working…' : submitLabel}
      </button>
    </div>
  );
}
