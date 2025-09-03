// Error Boundary Component for better error handling
// frontend/src/components/ErrorBoundary.jsx

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button } from './ui'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
    
    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      console.error('Error caught by boundary:', error, errorInfo)
      // TODO: Send to error monitoring service (Sentry, etc.)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-background-secondary)]">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <CardTitle className="text-[var(--color-error-600)] flex items-center gap-2">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[var(--color-text-secondary)]">
                We encountered an unexpected error. This has been logged and we'll look into it.
              </p>
              
              {process.env.NODE_ENV === 'development' && (
                <details className="bg-[var(--color-gray-50)] p-3 rounded border">
                  <summary className="cursor-pointer font-medium text-sm">
                    Error Details (Development Only)
                  </summary>
                  <div className="mt-2 text-xs font-mono">
                    <div className="text-[var(--color-error-600)] font-bold">
                      {this.state.error && this.state.error.toString()}
                    </div>
                    <div className="mt-2 text-[var(--color-text-secondary)] whitespace-pre-wrap">
                      {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </div>
                  </div>
                </details>
              )}
              
              <div className="flex gap-3">
                <Button onClick={this.handleReset} variant="primary">
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                >
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
