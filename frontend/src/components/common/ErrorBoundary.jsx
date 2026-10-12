import React from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('PillSync Clinical Error Caught by Boundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0d1e1a 0%, #173832 50%, #1f4a43 100%)',
            padding: '24px',
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              background: 'rgba(255, 255, 255, 0.98)',
              borderRadius: '20px',
              padding: '36px 32px',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
              textAlign: 'center',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 20px',
                borderRadius: '16px',
                background: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#dc2626',
              }}
            >
              <ShieldAlert size={36} />
            </div>

            <h2
              style={{
                fontSize: '20px',
                fontWeight: '800',
                color: '#0f172a',
                marginBottom: '10px',
              }}
            >
              Portal Session Recovered
            </h2>

            <p
              style={{
                fontSize: '13px',
                color: '#64748b',
                lineHeight: '1.6',
                marginBottom: '24px',
              }}
            >
              The application encountered a minor state exception. Your secure clinical session data
              is safe and preserved.
            </p>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
              }}
            >
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #3a9e90, #50b8a9)',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '13px',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(58, 158, 144, 0.3)',
                }}
              >
                <RefreshCw size={16} />
                Reload Portal
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#f1f5f9',
                  color: '#334155',
                  fontWeight: '700',
                  fontSize: '13px',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Home size={16} />
                Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
