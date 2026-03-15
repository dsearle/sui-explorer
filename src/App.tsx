import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { SearchBar } from './components/SearchBar'
import { NetworkSelector } from './components/NetworkSelector'
import { ObjectGraph } from './components/ObjectGraph'
import { ObjectPanel } from './components/ObjectPanel'
import { TransactionInspector } from './components/TransactionInspector'
import { PackageViewer } from './components/PackageViewer'
import { Directory } from './components/Directory'
import { ProtocolDetail } from './components/ProtocolDetail'
import { useObjectGraph } from './hooks/useObjectGraph'
import { useTransaction } from './hooks/useTransaction'
import { usePackage } from './hooks/usePackage'
import { analyzePackage, type PackageAnalysis } from './lib/packageAnalyzer'
import type { Protocol } from './data/protocols'
import type { Network } from './lib/suiClient'

type Mode = 'directory' | 'protocol' | 'object' | 'transaction' | 'package'

const SEARCH_MODES = ['object', 'transaction', 'package'] as const
type SearchMode = typeof SEARCH_MODES[number]

const MODE_META: Record<SearchMode, { icon: string; label: string; placeholder: string; example: { label: string; value: string } }> = {
  object: {
    icon: '⬡',
    label: 'Object',
    placeholder: 'Enter a Sui Object ID (e.g. 0x5)',
    example: { label: 'Try 0x5', value: '0x5' },
  },
  transaction: {
    icon: '⚡',
    label: 'Transaction',
    placeholder: 'Enter a transaction digest',
    example: { label: '', value: '' },
  },
  package: {
    icon: '📦',
    label: 'Package',
    placeholder: 'Enter a package ID (e.g. 0x2)',
    example: { label: 'Try 0x2', value: '0x2' },
  },
}

function getInitialState(): { searchMode: SearchMode; query: string; network: Network } {
  if (typeof window === 'undefined') return { searchMode: 'object', query: '', network: 'mainnet' }
  const params = new URLSearchParams(window.location.search)
  const mode = params.get('mode') as SearchMode
  const query = params.get('q') ?? ''
  const network = (params.get('network') as Network) ?? 'mainnet'
  return {
    searchMode: SEARCH_MODES.includes(mode) ? mode : 'object',
    query,
    network,
  }
}

function updateUrl(mode: Mode, q: string, net: Network) {
  const params = new URLSearchParams()
  if (mode !== 'directory' && mode !== 'protocol') params.set('mode', mode)
  if (q) params.set('q', q)
  if (net !== 'mainnet') params.set('network', net)
  window.history.replaceState({}, '', params.toString() ? `?${params.toString()}` : '/')
}

export default function App() {
  const initial = getInitialState()
  const [mode, setMode] = useState<Mode>(initial.query ? (initial.searchMode as Mode) : 'directory')
  const [searchMode, setSearchMode] = useState<SearchMode>(initial.searchMode)
  const [network, setNetwork] = useState<Network>(initial.network)
  const [panelOpen, setPanelOpen] = useState(false)
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null)
  const [analysis, setAnalysis] = useState<PackageAnalysis | null>(null)

  const objectGraph = useObjectGraph(network)
  const transaction = useTransaction(network)
  const pkg = usePackage(network)

  // Derive analysis when package modules load
  useEffect(() => {
    if (pkg.modules) {
      setAnalysis(analyzePackage(pkg.modules))
    } else {
      setAnalysis(null)
    }
  }, [pkg.modules])

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
      const m = initial.searchMode
      if (m === 'object') objectGraph.fetchObject(initial.query, handleNodeClick)
      if (m === 'transaction') transaction.fetchTransaction(initial.query)
      if (m === 'package') pkg.fetchPackage(initial.query)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = useCallback((id: string) => {
    setMode(searchMode)
    if (searchMode === 'object') {
      objectGraph.fetchObject(id, handleNodeClick)
      setPanelOpen(true)
    } else if (searchMode === 'transaction') {
      transaction.fetchTransaction(id)
    } else {
      pkg.fetchPackage(id)
    }
    updateUrl(searchMode, id, network)
  }, [searchMode, network, objectGraph, transaction, pkg, handleNodeClick])

  const handleNetworkChange = useCallback((n: Network) => {
    setNetwork(n)
  }, [])

  const handleSelectProtocol = useCallback((protocol: Protocol) => {
    setSelectedProtocol(protocol)
    setMode('protocol')
    setAnalysis(null)
    updateUrl('protocol', '', network)
  }, [network])

  const handleExplorePackage = useCallback((packageId: string) => {
    setSearchMode('package')
    setMode('package')
    pkg.fetchPackage(packageId)
    updateUrl('package', packageId, network)
  }, [network, pkg])

  const handleExploreObject = useCallback((objectId: string) => {
    setSearchMode('object')
    setMode('object')
    objectGraph.fetchObject(objectId, handleNodeClick)
    setPanelOpen(true)
    updateUrl('object', objectId, network)
  }, [network, objectGraph, handleNodeClick])

  const handleProtocolLoadPackage = useCallback((packageId: string) => {
    pkg.fetchPackage(packageId)
  }, [pkg])

  const handleObjectFromTx = useCallback((id: string) => {
    setSearchMode('object')
    setMode('object')
    objectGraph.fetchObject(id, handleNodeClick)
    setPanelOpen(true)
    updateUrl('object', id, network)
  }, [network, objectGraph, handleNodeClick])

  const currentLoading = useMemo(() => {
    if (searchMode === 'object') return objectGraph.loading
    if (searchMode === 'transaction') return transaction.loading
    return pkg.loading
  }, [searchMode, objectGraph.loading, transaction.loading, pkg.loading])

  const showSearchBar = mode !== 'directory' && mode !== 'protocol'

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0d1117] overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-[#30363d] bg-[#0d1117] z-10 flex-shrink-0">
        {/* Logo — always clickable to go home */}
        <button
          onClick={() => { setMode('directory'); updateUrl('directory', '', network) }}
          className="flex items-center gap-2 flex-shrink-0 group"
        >
          <div className="w-7 h-7 rounded-lg bg-[#6fbcf0] flex items-center justify-center
            group-hover:bg-[#5aa8e0] transition-colors">
            <svg viewBox="0 0 20 20" className="w-4 h-4 text-[#0d1117]" fill="currentColor">
              <circle cx="10" cy="4" r="2.5" />
              <circle cx="4" cy="14" r="2.5" />
              <circle cx="16" cy="14" r="2.5" />
              <line x1="10" y1="6.5" x2="5" y2="12" stroke="currentColor" strokeWidth="1.2" />
              <line x1="10" y1="6.5" x2="15" y2="12" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-white hidden sm:block group-hover:text-[#6fbcf0]
            transition-colors">
            Sui Explorer
          </span>
        </button>

        {/* Divider + breadcrumb when on protocol page */}
        {mode === 'protocol' && selectedProtocol && (
          <>
            <span className="text-gray-600 text-sm hidden sm:block">/</span>
            <div className="flex items-center gap-2 flex-shrink-0 hidden sm:flex">
              <span className="text-sm">{selectedProtocol.emoji}</span>
              <span className="text-sm text-gray-300 font-medium">{selectedProtocol.name}</span>
            </div>
          </>
        )}

        {/* Search mode tabs (only when not in directory/protocol view) */}
        {showSearchBar && (
          <div className="flex items-center bg-[#161b22] border border-[#30363d] rounded-lg p-0.5 flex-shrink-0">
            {SEARCH_MODES.map((m) => (
              <button
                key={m}
                onClick={() => { setSearchMode(m); const current = mode as string; if (current !== 'directory' && current !== 'protocol') setMode(m) }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                  ${searchMode === m
                    ? 'bg-[#6fbcf0] text-[#0d1117] font-semibold'
                    : 'text-gray-400 hover:text-white'
                  }`}
              >
                <span>{MODE_META[m].icon}</span>
                <span>{MODE_META[m].label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Search bar (context-aware) */}
        {showSearchBar ? (
          <SearchBar
            onSearch={handleSearch}
            loading={currentLoading}
            placeholder={MODE_META[searchMode].placeholder}
            example={MODE_META[searchMode].example}
          />
        ) : (
          /* On directory/protocol — a global search hint */
          <div className="flex-1" />
        )}

        {/* Network selector */}
        <div className="flex-shrink-0">
          <NetworkSelector network={network} onChange={handleNetworkChange} />
        </div>

        {/* Object detail toggle */}
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
            Details
          </button>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 flex overflow-hidden">
        {mode === 'directory' && (
          <Directory
            onSelectProtocol={handleSelectProtocol}
            onSearchPackage={handleExplorePackage}
          />
        )}

        {mode === 'protocol' && selectedProtocol && (
          <ProtocolDetail
            protocol={selectedProtocol}
            packageState={pkg}
            analysis={analysis}
            onBack={() => { setMode('directory'); updateUrl('directory', '', network) }}
            onExplorePackage={handleExplorePackage}
            onExploreObject={handleExploreObject}
            onLoadPackage={handleProtocolLoadPackage}
          />
        )}

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
