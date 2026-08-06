import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CategoryChip, StatusBadge } from './Badge';

describe('status and category badges', () => {
  it('renders the status label', () => {
    render(<StatusBadge status="Approved" />);
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('renders each goal category chip', () => {
    render(<CategoryChip category="Client" />);
    expect(screen.getByText('Client')).toBeInTheDocument();
  });
});
