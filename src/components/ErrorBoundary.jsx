import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          color: 'var(--color-text)',
          backgroundColor: 'var(--color-bg)',
          fontFamily: 'var(--font-family)',
        }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Что-то пошло не так</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
            {this.state.error?.message || 'Неизвестная ошибка'}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/' }}
            style={{
              padding: '0.5rem 1.5rem',
              background: 'var(--color-accent)',
              color: 'var(--color-text-on-dark)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            На главную
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
