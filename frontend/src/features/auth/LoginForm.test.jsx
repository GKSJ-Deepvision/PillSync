import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { anonymousState, renderWithProviders } from '../../../tests/utils.jsx';
import LoginForm from './LoginForm.jsx';

vi.mock('../../api/auth.js', () => ({
  default: { login: vi.fn() },
  authApi: { login: vi.fn() },
}));

const { default: authApi } = await import('../../api/auth.js');

describe('LoginForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the fields a sign-in needs', () => {
    renderWithProviders(<LoginForm />, { preloadedState: anonymousState() });

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('validates before calling the API', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />, { preloadedState: anonymousState() });

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/enter your email address/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('rejects a malformed email without a request', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />, { preloadedState: anonymousState() });

    await user.type(screen.getByLabelText(/email address/i), 'not-an-email');
    await user.type(screen.getByLabelText(/password/i), 'a-real-password');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/valid email address/i)).toBeInTheDocument();
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('submits valid credentials and stores the user', async () => {
    const user = userEvent.setup();
    authApi.login.mockResolvedValue({
      id: 'user-1',
      email: 'asha@example.com',
      full_name: 'Asha Patel',
      role: 'PATIENT',
    });

    const { store } = renderWithProviders(<LoginForm />, { preloadedState: anonymousState() });

    await user.type(screen.getByLabelText(/email address/i), 'asha@example.com');
    await user.type(screen.getByLabelText(/password/i), 'correct-horse-battery-42');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'asha@example.com',
        password: 'correct-horse-battery-42', // pragma: allowlist secret
      });
    });
    await waitFor(() => expect(store.getState().auth.status).toBe('authenticated'));
    expect(store.getState().auth.user.email).toBe('asha@example.com');
  });

  it('shows the server message when the credentials are wrong', async () => {
    const user = userEvent.setup();
    authApi.login.mockRejectedValue({
      code: 'not_authenticated',
      message: 'Incorrect email or password.',
      details: {},
      status: 401,
    });

    renderWithProviders(<LoginForm />, { preloadedState: anonymousState() });

    await user.type(screen.getByLabelText(/email address/i), 'asha@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong-password-here');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password.');
  });

  it('clears the field error as soon as the user corrects it', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />, { preloadedState: anonymousState() });

    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/enter your email address/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/email address/i), 'a');
    await waitFor(() =>
      expect(screen.queryByText(/enter your email address/i)).not.toBeInTheDocument()
    );
  });
});
