import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    
    // Here you could send error to logging service
    // logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
          <div className="max-w-md w-full mx-auto p-6">
            <div className="card">
              <div className="card-body text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-danger-100 dark:bg-danger-900/20 mb-4">
                  <svg className="h-6 w-6 text-danger-600 dark:text-danger-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                
                <h3 className="text-lg font-medium text-secondary-900 dark:text-secondary-100 mb-2">
                  Something went wrong
                </h3>
                
                <p className="text-secondary-600 dark:text-secondary-400 mb-6">
                  We're sorry, but something unexpected happened. Please try refreshing the page.
                </p>
                
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="text-left mb-4 p-4 bg-secondary-100 dark:bg-secondary-800 rounded-lg">
                    <summary className="cursor-pointer text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Error Details (Development Only)
                    </summary>
                    <pre className="text-xs text-danger-600 dark:text-danger-400 overflow-auto">
                      {this.state.error.toString()}
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => window.location.reload()}
                    className="btn btn-primary"
                  >
                    Refresh Page
                  </button>
                  
                  <button
                    onClick={() => window.location.href = '/'}
                    className="btn btn-secondary"
                  >
                    Go Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;