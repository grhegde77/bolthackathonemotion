import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

// Add error boundary to catch and display errors
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('React Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#1f2937',
          color: 'white',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <h1 style={{ color: '#ef4444', marginBottom: '16px' }}>Something went wrong</h1>
          <p style={{ marginBottom: '16px' }}>The application encountered an error and couldn't load.</p>
          <details style={{ marginBottom: '16px', textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>Error Details</summary>
            <pre style={{ 
              backgroundColor: '#374151', 
              padding: '12px', 
              borderRadius: '8px',
              fontSize: '12px',
              overflow: 'auto'
            }}>
              {this.state.error?.toString()}
              {'\n'}
              {this.state.error?.stack}
            </pre>
          </details>
          <button 
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// Add console logging to track initialization
console.log('Starting Aura application...')

try {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    throw new Error('Root element not found')
  }

  console.log('Root element found, creating React root...')
  
  const root = ReactDOM.createRoot(rootElement)
  
  console.log('React root created, rendering app...')
  
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  )
  
  console.log('App rendered successfully')
} catch (error) {
  console.error('Failed to initialize app:', error)
  
  // Fallback error display
  const rootElement = document.getElementById('root')
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="
        padding: 20px;
        text-align: center;
        background-color: #1f2937;
        color: white;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      ">
        <h1 style="color: #ef4444; margin-bottom: 16px;">Application Failed to Load</h1>
        <p style="margin-bottom: 16px;">There was an error initializing the application.</p>
        <pre style="
          background-color: #374151;
          padding: 12px;
          border-radius: 8px;
          font-size: 12px;
          overflow: auto;
          margin-bottom: 16px;
        ">${error}</pre>
        <button onclick="window.location.reload()" style="
          background-color: #8b5cf6;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
        ">Reload Page</button>
      </div>
    `
  }
}