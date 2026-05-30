import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '70vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: 480 }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
              }}
            >
              <AlertTriangle size={40} />
            </div>
            <h2 style={{ marginBottom: '0.5rem' }}>เกิดข้อผิดพลาดในการแสดงหน้านี้</h2>
            <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
              ขออภัย! โปรดลองโหลดหน้าใหม่หรือกลับไปยังหน้าหลัก
            </p>
            {this.state.error && (
              <pre
                style={{
                  background: '#f3f4f6',
                  padding: '0.75rem',
                  borderRadius: 8,
                  fontSize: '0.75rem',
                  textAlign: 'left',
                  margin: '1rem 0',
                  overflow: 'auto',
                  maxHeight: 120,
                }}
              >
                {this.state.error.message}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="btn-secondary" onClick={() => window.location.reload()}>
                <RefreshCw size={16} /> โหลดใหม่
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  this.reset();
                  window.location.href = '/';
                }}
              >
                <Home size={16} /> กลับหน้าหลัก
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
