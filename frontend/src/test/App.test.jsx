import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../App';

describe('App', () => {
  it('renders the PillSync login page', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'PillSync' }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: 'Welcome to PillSync' }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText('Username')).toBeInTheDocument();

    expect(screen.getByLabelText('Password')).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Login as Patient' }),
    ).toBeInTheDocument();
  });
});
