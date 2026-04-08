import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    const { error } = this.state
    if (error) {
      return (
        <div style={{
          minHeight: '100vh', background: '#0d1117', color: '#f87171',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', padding: '2rem', fontFamily: 'monospace',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💥 Runtime Error</div>
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: '1.5rem', maxWidth: 700, width: '100%' }}>
            <div style={{ color: '#f87171', fontWeight: 'bold', marginBottom: '0.5rem' }}>{error.message}</div>
            <pre style={{ color: '#9ca3af', fontSize: '0.7rem', whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
              {error.stack}
            </pre>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
