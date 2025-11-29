import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ToastProvider } from './components/ui/Toast';

// Lazy load the main application
const MyndigheterV6 = React.lazy(() => import('./MyndigheterApp'));

// Loading component
const FullScreenLoader = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
    <div className="text-center">
      <Loader2 className="w-10 h-10 text-primary-500 animate-spin mx-auto mb-4" />
      <p className="text-slate-500 font-medium">Laddar applikationen...</p>
    </div>
  </div>
);

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
        <div className="p-10 max-w-2xl mx-auto font-sans">
          <h1 className="text-red-600 text-2xl font-bold mb-4">Något gick fel</h1>
          <p className="mb-4 text-slate-700">Ett fel uppstod vid laddning av applikationen.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
      <ToastProvider>
        <Suspense fallback={<FullScreenLoader />}>
          <MyndigheterV6 />
        </Suspense>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
