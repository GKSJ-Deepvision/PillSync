import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Notifications from '../pages/patient/Notifications';
import { medicationService } from '../services/medicationService';

vi.mock('../services/medicationService', () => ({ medicationService: { listReminders: vi.fn(), markReminderTaken: vi.fn(), markReminderMissed: vi.fn(), snoozeReminder: vi.fn() } }));

describe('Notifications', () => {
  beforeEach(() => { vi.clearAllMocks(); medicationService.listReminders.mockResolvedValue([{ id: 1, scheduled_at: '2026-08-31T08:00:00Z', period: 'morning', status: 'pending' }]); });
  it('renders reminders from the backend service', async () => { render(<Notifications />); await waitFor(() => expect(screen.getByText('Scheduled dose')).toBeInTheDocument()); expect(screen.getByRole('button', { name: /Taken/i })).toBeInTheDocument(); });
  it('shows an empty state when no reminders exist', async () => { medicationService.listReminders.mockResolvedValue([]); render(<Notifications />); expect(await screen.findByText('No reminders yet')).toBeInTheDocument(); });
});
