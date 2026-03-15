import { useState, useCallback, useRef, useEffect } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { SearchBar } from './components/SearchBar'
import { NetworkSelector } from './components/NetworkSelector'
import { ObjectGraph } from './components/ObjectGraph'
import { ObjectPanel } from './components/ObjectPanel'
import { TransactionInspector } from './components/TransactionInspector'
import { PackageViewer } from './components/PackageViewer'
import { useObjectGraph } from './hooks/useObjectGraph'
import { useTransaction } from './hooks/useTransaction'
import { usePackage } from './hooks/usePackage'
import type { Network } from './lib/suiClient'

type Mode = 'object' | 'transaction' | 'package'

const MODES: { id: Mode; label: string; icon: string; placeholder: string; example: { label: string; value: string } }[] = [
  {
    id: 'object',
    label: 'Object',
    icon: '⬡',
    placeholder: 'Enter a Sui Object ID (e.g. 0x5)',
    example: { label: 'Try 0x5', value: '0x5' },
  },
  {
    id: 'transaction',
    label: 'Transaction',
    icon: '⚡',
    placeholder: 'Enter a transaction digest',
    example: { label: 'Example tx', value: '' },
  },
  {
    id: 'package',
    label: 'Package',
    icon: '📦',
    placeholder: 'Enter a package ID (e.g. 0x2)',
    example: { label: 'Try 0x2', value: '0x2' },
  },
]

// Parse query params on load
function getInitialState(): { mode: Mode; query: string; network: Network } {
  if (typeof window === 'undefined') return { mode: 'object', query: '', network: 'mainnet' }
  const params = new URLSearchParams(window.location.search)
  const mode = (params.get('mode') as Mode) ?? 'object'
  const query = params.get('q') ?? ''
  const network = (params.get('network') as Network) ?? 'mainnet'
  return { mode: MODES.find((m) => m.id === mode) ? mode : 'object', query, network }
}

export default function App() {
  const initial = getInitialState()
  const [mode, setMode] = useState<Mode>(initial.mode)
  const [network, setNetwork] = useState<Network>(initial.network)
  const [panelOpen, setPanelOpen] = useState(false)

  const objectGraph = useObjectGraph(network)
  const transaction = useTransaction(network)
  const pkg = usePackage(network)

  // Stable ref for node click navigation
  const handleNodeClickRef = useRef<(id: string) => void>(() => {})

  const handleNodeClick = useCallback((id: string) => {
    setMode('object')
    objectGraph.fetchObject(id, handleNodeClickRef.current)
    setPanelOpen(true)
    updateUrl('object', id, network)
  }, [network, objectGraph])

  handleNodeClickRef.current = handleNodeClick

  // Load from URL params on mount
  useEffect(() => {
    if (initial.query) {
      if (initial.mode === 'object') objectGraph.fetchObject(initial.query, handleNodeClick)
      if (initial.mode === 'transaction') transaction.fetchTransaction(initial.query)
      if (initial.mode === 'package') pkg.fetchPackage(initial.query)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function updateUrl(m: Mode, q: string, net: Network) {
    const params = new URLSearchParams()
    params.set('mode', m)
    if (q) params.set('q', q)
    if (net !== 'mainnet') params.set('network', net)
    window.history.replaceState({}, '', `?${params.toString()}`)
  }

  const handleSearch = useCallback(
    (id: string) => {
      if (mode === 'object') {
        objectGraph.fetchObject(id, handleNodeClick)
        setPanelOpen(true)
      } else if (mode === 'transaction') {
        transaction.fetchTransaction(id)
      } else if (mode === 'package') {
        pkg.fetchPackage(id)
      }
      updateUrl(mode, id, network)
    },
    [mode, network, objectGraph, transaction, pkg, handleNodeClick]
  )

  const handleNetworkChange = useCallback((n: Network) => {
    setNetwork(n)
    updateUrl(mode, '', n)
  }, [mode])

  const handleModeChange = useCallback((m: Mode) => {
    setMode(m)
    setPanelOpen(false)
    updateUrl(m, '', network)
  }, [network])

  const currentMode = MODES.find((m) => m.id === mode)!

  // Navigate to object from transaction inspector
  const handleObjectFromTx = useCallback((id: string) => {
    setMode('object')
    objectGraph.fetchObject(id, handleNodeClick)
    setPanelOpen(true)
    updateUrl('object', id, network)
  }, [network, objectGraph, handleNodeClick])

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0d1117] overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-[#30363d] bg-[#0d1117]
        z-10 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-[#6fbcf0] flex items-center justify-center">
            <svg viewBox="0 0 20 20" className="w-4 h-4 text-[#0d1117]" fill="currentColor">
              <circle cx="10" cy="4" r="2.5" />
              <circle cx="4" cy="14" r="2.5" />
              <circle cx="16" cy="14" r="2.5" />
              <line x1="10" y1="6.5" x2="5" y2="12" stroke="currentColor" strokeWidth="1.2" />
              <line x1="10" y1="6.5" x2="15" y2="12" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-white hidden lg:block">Sui Object Explorer</span>
        </div>

        {/* Mode tabs */}
        <div className="flex items-center bg-[#161b22] border border-[#30363d] rounded-lg p-0.5 flex-shrink-0">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => handleModeChange(m.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                ${mode === m.id
                  ? 'bg-[#6fbcf0] text-[#0d1117] font-semibold'
                  : 'text-gray-400 hover:text-white'
                }`}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <SearchBar
          onSearch={handleSearch}
          loading={
            mode === 'object' ? objectGraph.loading :
            mode === 'transaction' ? transaction.loading :
            pkg.loading
          }
          placeholder={currentMode.placeholder}
          example={currentMode.example}
        />

        {/* Network selector */}
        <div className="flex-shrink-0">
          <NetworkSelector network={network} onChange={handleNetworkChange} />
        </div>

        {/* Details panel toggle (object mode only) */}
        {mode === 'object' && objectGraph.objectData && (
          <button
            onClick={() => setPanelOpen((p) => !p)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs
              border transition-colors
              ${panelOpen
                ? 'bg-[#6fbcf0] text-[#0d1117] border-[#6fbcf0] font-semibold'
                : 'bg-[#161b22] text-gray-400 border-[#30363d] hover:text-white'
              }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Details
          </button>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 flex overflow-hidden">
        {mode === 'object' && (
          <>
            <ReactFlowProvider>
              <ObjectGraph
                graphData={objectGraph.graphData}
                loading={objectGraph.loading}
                error={objectGraph.error}
              />
            </ReactFlowProvider>
            {panelOpen && objectGraph.objectData && (
              <ObjectPanel data={objectGraph.objectData} onClose={() => setPanelOpen(false)} />
            )}
          </>
        )}

        {mode === 'transaction' && (
          <TransactionInspector
            data={transaction.data}
            loading={transaction.loading}
            error={transaction.error}
            onObjectClick={handleObjectFromTx}
          />
        )}

        {mode === 'package' && (
          <PackageViewer
            modules={pkg.modules}
            selectedModule={pkg.selectedModule}
            packageId={pkg.packageId}
            loading={pkg.loading}
            error={pkg.error}
            onSelectModule={pkg.selectModule}
          />
        )}
      </main>
    </div>
  )
}
