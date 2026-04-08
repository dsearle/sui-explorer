import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { WalletProvider } from './lib/WalletContext.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <WalletProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </WalletProvider>
    </ErrorBoundary>
  </StrictMode>,
)
