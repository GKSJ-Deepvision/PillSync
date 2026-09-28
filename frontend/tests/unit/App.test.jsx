import { render, screen } from '@testing-library/react';

jest.mock('../../src/context/AuthContext', () => ({
  AuthProvider: ({ children }) => <>{children}</>,
}));

jest.mock('../../src/routes/AppRoutes', () => ({
  AppRoutes: () => <div>App routes</div>,
}));

import App from '../../src/App';

describe('App Component', () => {
  it('should render without crashing', () => {
    render(<App />);

    expect(screen.getByText(/app routes/i)).toBeInTheDocument();
  });
});
