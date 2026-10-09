import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import { createStore } from '../src/store/index.js';

/**
 * Render a component inside the providers the app supplies in production.
 *
 * Each call builds a fresh store, so state never leaks between tests.
 */
export function renderWithProviders(ui, { preloadedState, route = '/', ...options } = {}) {
  const store = createStore(preloadedState);

  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...options }) };
}

export const authenticatedState = (overrides = {}) => ({
  auth: {
    status: 'authenticated',
    error: null,
    user: {
      id: 'user-1',
      email: 'asha@example.com',
      full_name: 'Asha Patel',
      role: 'PATIENT',
      role_display: 'Patient',
      ...overrides,
    },
  },
});

export const anonymousState = () => ({
  auth: { status: 'anonymous', error: null, user: null },
});
