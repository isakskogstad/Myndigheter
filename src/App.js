import React from 'react';
import MyndigheterV6 from './MyndigheterApp';

// Error Boundary to catch runtime errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          maxWidth: '600px',
          margin: '0 auto',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h1 style={{ color: '#dc2626' }}>Något gick fel</h1>
          <p>Ett fel uppstod vid laddning av applikationen.</p>
          <details style={{
            marginTop: '20px',
            padding: '10px',
            background: '#f5f5f5',
            borderRadius: '8px'
          }}>
            <summary style={{ cursor: 'pointer' }}>Teknisk information</summary>
            <pre style={{
              fontSize: '12px',
              overflow: 'auto',
              whiteSpace: 'pre-wrap'
            }}>
              {this.state.error && this.state.error.toString()}
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Ladda om sidan
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <MyndigheterV6 />
    </ErrorBoundary>
  );
}

export default App;
