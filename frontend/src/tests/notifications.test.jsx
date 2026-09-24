import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Notifications from '../pages/patient/Notifications';

const renderNotifications = () => render(<Notifications />);

describe('Notifications refill workflows', () => {
  it('renders refill notification information', () => {
    renderNotifications();

    expect(screen.getByTestId('refill-notification')).toBeInTheDocument();
    expect(screen.getByText('Lisinopril')).toBeInTheDocument();
    expect(screen.getByText('7 days remaining')).toBeInTheDocument();
    expect(screen.getByText('medium urgency')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /Lisinopril stock remaining/i })).toBeInTheDocument();
  });

  it('opens refill details in the existing modal', () => {
    renderNotifications();

    fireEvent.click(screen.getByRole('button', { name: /View Details/i }));

    expect(screen.getByRole('heading', { name: 'Refill Details' })).toBeInTheDocument();
    expect(screen.getByText('Current stock')).toBeInTheDocument();
    expect(screen.getByText('7 tablets')).toBeInTheDocument();
    expect(screen.getByText('Recommendation: plan a refill soon to avoid missing a scheduled dose.')).toBeInTheDocument();
  });

  it('postpones a refill reminder without deleting it', () => {
    renderNotifications();

    fireEvent.click(screen.getByRole('button', { name: /Remind Me Later/i }));

    expect(screen.getByText('Reminder postponed')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/postponed locally/i);
    expect(screen.getByTestId('refill-notification')).toBeInTheDocument();
  });

  it('shows demo feedback when refill now is selected', () => {
    renderNotifications();

    fireEvent.click(screen.getByRole('button', { name: 'Refill Now' }));

    expect(screen.getByRole('status')).toHaveTextContent(/Demo only: refill action initiated/i);
    expect(screen.getByText('Demo refill action initiated')).toBeInTheDocument();
  });

  it('toggles a notification read state and preserves mark all read', () => {
    renderNotifications();

    fireEvent.click(screen.getAllByRole('button', { name: 'Mark as read' })[0]);
    expect(screen.getAllByRole('button', { name: 'Mark as unread' }).length).toBeGreaterThan(1);

    fireEvent.click(screen.getByRole('button', { name: /Mark all read/i }));
    expect(screen.getAllByRole('button', { name: 'Mark as unread' })).toHaveLength(3);
  });

  it('filters refill notifications locally', () => {
    renderNotifications();

    fireEvent.click(screen.getByRole('button', { name: 'Refill' }));

    expect(screen.getAllByTestId('refill-notification')).toHaveLength(1);
    expect(screen.queryByText('Caregiver Update')).not.toBeInTheDocument();
  });

  it('shows a filter empty state and clears all notifications', () => {
    renderNotifications();

    fireEvent.click(screen.getByRole('button', { name: 'Unread' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mark all read' }));
    expect(screen.getByText('No Matching Notifications')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Clear all/i }));
    expect(screen.getByText('All Caught Up!')).toBeInTheDocument();
  });
});