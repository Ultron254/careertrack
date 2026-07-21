import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';
import { useFocusTrap } from './useFocusTrap';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  label: string;
  width?: number;
  children: ReactNode;
}

export function Modal({ open, onClose, label, width = 560, children }: ModalProps) {
  const dialogRef = useFocusTrap<HTMLDivElement>(open, onClose);

  if (!open) return null;

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        style={{ maxWidth: width }}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
