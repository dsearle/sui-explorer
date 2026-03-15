import { useState, useCallback, useRef } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { SearchBar } from './components/SearchBar'
import { NetworkSelector } from './components/NetworkSelector'
import { ObjectGraph } from './components/ObjectGraph'
import { ObjectPanel } from './components/ObjectPanel'
import { useObjectGraph } from './hooks/useObjectGraph'
import type { Network } from './lib/suiClient'

export default function App() {
  const [network, setNetwork] = useState<Network>('mainnet')
  const [panelOpen, setPanelOpen] = useState(false)

  const { loading, error, objectData, graphData, fetchObject } = useObjectGraph(network)

  // Stable callback ref to avoid stale closures in graph builder
  const fetchRef = useRef(fetchObject)
  fetchRef.current = fetchObject

  const handleNodeClick = useCallback((id: string) => {
    fetchRef.current(id, handleNodeClick)
    setPanelOpen(true)
  }, [])

  const handleSearch = useCallback(
    (id: string) => {
      fetchObject(id, handleNodeClick)
      setPanelOpen(true)
    },
    [fetchObject, handleNodeClick]
  )

  const handleNetworkChange = useCallback((n: Network) => {
    setNetwork(n)
  }, [])

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0d1117] overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center gap-4 px-5 py-3 border-b border-[#30363d] bg-[#0d1117]
        z-10 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-[#6fbcf0] flex items-center justify-center">
            <svg viewBox="0 0 20 20" className="w-4 h-4 text-[#0d1117]" fill="currentColor">
              <circle cx="10" cy="4" r="2.5" />
              <circle cx="4" cy="14" r="2.5" />
              <circle cx="16" cy="14" r="2.5" />
              <line x1="10" y1="6.5" x2="5" y2="12" stroke="currentColor" strokeWidth="1.2" />
              <line x1="10" y1="6.5" x2="15" y2="12" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-white hidden sm:block">Sui Object Explorer</span>
        </div>

        {/* Search */}
        <SearchBar onSearch={handleSearch} loading={loading} />

        {/* Network selector */}
        <div className="flex-shrink-0">
          <NetworkSelector network={network} onChange={handleNetworkChange} />
        </div>

        {/* Panel toggle */}
        {objectData && (
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
        {/* Graph area */}
        <ReactFlowProvider>
          <ObjectGraph graphData={graphData} loading={loading} error={error} />
        </ReactFlowProvider>

        {/* Side panel */}
        {panelOpen && objectData && (
          <ObjectPanel data={objectData} onClose={() => setPanelOpen(false)} />
        )}
      </main>
    </div>
  )
}
