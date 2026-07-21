import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from './Sheet.module.css';
import { useFocusTrap } from './useFocusTrap';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
}

export function Sheet({ open, onClose, label, children }: SheetProps) {
  const panelRef = useFocusTrap<HTMLDivElement>(open, onClose);

  if (!open) return null;

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.handle} />
        {children}
      </div>
    </div>,
    document.body,
  );
}
