import { useState, useCallback, useEffect, useMemo } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { SearchBar } from './components/SearchBar'
import { NetworkSelector } from './components/NetworkSelector'
import { ObjectGraph } from './components/ObjectGraph'
import { ObjectPanel } from './components/ObjectPanel'
import { TransactionInspector } from './components/TransactionInspector'
import { PackageViewer } from './components/PackageViewer'
import { Directory } from './components/Directory'
import { ProtocolDetail } from './components/ProtocolDetail'
import { ChainHero } from './components/ChainHero'
import { useObjectGraph } from './hooks/useObjectGraph'
import { useTransaction } from './hooks/useTransaction'
import { usePackage } from './hooks/usePackage'
import { analyzePackage, type PackageAnalysis } from './lib/packageAnalyzer'
import type { Protocol } from './data/protocols'
import { PROTOCOLS } from './data/protocols'
import type { Network } from './lib/suiClient'

 type Mode = 'home' | 'directory' | 'protocol' | 'object' | 'transaction' | 'package'

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

 type ViewState = {
  mode: Mode
  objectId?: string
  txDigest?: string
  packageId?: string
  protocolId?: string
  searchMode?: SearchMode
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
  if (!['directory', 'protocol', 'home'].includes(mode)) params.set('mode', mode)
  if (q) params.set('q', q)
  if (net !== 'mainnet') params.set('network', net)
  window.history.replaceState({}, '', params.toString() ? `?${params.toString()}` : '/')
}

export default function App() {
  const initial = getInitialState()
  const defaultMode: Mode = initial.query ? (initial.searchMode as Mode) : 'home'
  const [mode, setMode] = useState<Mode>(defaultMode)
  const [searchMode, setSearchMode] = useState<SearchMode>(initial.searchMode)
  const [network, setNetwork] = useState<Network>(initial.network)
  const [panelOpen, setPanelOpen] = useState(false)
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null)
  const [analysis, setAnalysis] = useState<PackageAnalysis | null>(null)
  const [historyStack, setHistoryStack] = useState<ViewState[]>([])

  const objectGraph = useObjectGraph(network)
  const transaction = useTransaction(network)
  const pkg = usePackage(network)

  const protocolMap = useMemo(() => {
    const map = new Map<string, Protocol>()
    PROTOCOLS.forEach((p) => map.set(p.id, p))
    return map
  }, [])

  // Derive analysis when package modules load
  useEffect(() => {
    if (pkg.modules) {
      setAnalysis(analyzePackage(pkg.modules))
    } else {
      setAnalysis(null)
    }
  }, [pkg.modules])

  const getCurrentState = useCallback((): ViewState => {
    switch (mode) {
      case 'object':
        return {
          mode: 'object',
          objectId: objectGraph.currentId || objectGraph.objectData?.data?.objectId,
          searchMode,
        }
      case 'transaction':
        return { mode: 'transaction', txDigest: transaction.currentDigest, searchMode }
      case 'package':
        return { mode: 'package', packageId: pkg.packageId, searchMode }
      case 'protocol':
        return { mode: 'protocol', protocolId: selectedProtocol?.id }
      default:
        return { mode: 'directory' }
    }
  }, [mode, objectGraph.currentId, objectGraph.objectData, transaction.currentDigest, pkg.packageId, selectedProtocol, searchMode])

  const pushCurrentState = useCallback(() => {
    setHistoryStack((prev) => [...prev, getCurrentState()])
  }, [getCurrentState])

  const navigate = useCallback((nextMode: Mode, action: () => void, options?: { pushHistory?: boolean }) => {
    if (options?.pushHistory !== false) pushCurrentState()
    setMode(nextMode)
    action()
  }, [pushCurrentState])

  const openTransaction = useCallback((digest: string, options?: { pushHistory?: boolean }) => {
    navigate('transaction', () => {
      setSearchMode('transaction')
      transaction.fetchTransaction(digest)
      updateUrl('transaction', digest, network)
    }, options)
  }, [navigate, transaction, network])

  const handleTxClick = useCallback((digest: string) => {
    openTransaction(digest)
  }, [openTransaction])

  const openObject = useCallback((objectId: string, options?: { pushHistory?: boolean }) => {
    navigate('object', () => {
      setSearchMode('object')
      objectGraph.fetchObject(objectId, (nextId) => openObject(nextId), handleTxClick)
      setPanelOpen(true)
      updateUrl('object', objectId, network)
    }, options)
  }, [navigate, objectGraph, handleTxClick, network])

  const openPackage = useCallback((packageId: string, options?: { pushHistory?: boolean }) => {
    navigate('package', () => {
      setSearchMode('package')
      pkg.fetchPackage(packageId)
      updateUrl('package', packageId, network)
    }, options)
  }, [navigate, pkg, network])

  const openProtocol = useCallback((protocol: Protocol, options?: { pushHistory?: boolean }) => {
    navigate('protocol', () => {
      setSelectedProtocol(protocol)
      setAnalysis(null)
      updateUrl('protocol', '', network)
    }, options)
  }, [navigate, network])

  const openDirectory = useCallback((options?: { pushHistory?: boolean }) => {
    navigate('directory', () => {
      setSelectedProtocol(null)
      setAnalysis(null)
      updateUrl('directory', '', network)
    }, options)
  }, [navigate, network])

  const restoreView = useCallback((state: ViewState) => {
    switch (state.mode) {
      case 'object':
        if (state.objectId) openObject(state.objectId, { pushHistory: false })
        else openDirectory({ pushHistory: false })
        break
      case 'transaction':
        if (state.txDigest) openTransaction(state.txDigest, { pushHistory: false })
        else openDirectory({ pushHistory: false })
        break
      case 'package':
        if (state.packageId) openPackage(state.packageId, { pushHistory: false })
        else openDirectory({ pushHistory: false })
        break
      case 'protocol':
        if (state.protocolId) {
          const proto = protocolMap.get(state.protocolId)
          if (proto) openProtocol(proto, { pushHistory: false })
          else openDirectory({ pushHistory: false })
        } else {
          openDirectory({ pushHistory: false })
        }
        break
      default:
        openDirectory({ pushHistory: false })
    }
  }, [openDirectory, openObject, openTransaction, openPackage, openProtocol, protocolMap])

  const handleBack = useCallback(() => {
    setHistoryStack((prev) => {
      if (prev.length === 0) return prev
      const next = prev.slice(0, -1)
      const target = prev[prev.length - 1]
      restoreView(target)
      return next
    })
  }, [restoreView])

  const canGoBack = historyStack.length > 0

  // Load from URL params on mount
  useEffect(() => {
    if (initial.query) {
      const m = initial.searchMode
      if (m === 'object') openObject(initial.query, { pushHistory: false })
      if (m === 'transaction') openTransaction(initial.query, { pushHistory: false })
      if (m === 'package') openPackage(initial.query, { pushHistory: false })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = useCallback((id: string) => {
    if (searchMode === 'object') {
      openObject(id)
      setPanelOpen(true)
    } else if (searchMode === 'transaction') {
      openTransaction(id)
    } else {
      openPackage(id)
    }
  }, [searchMode, openObject, openTransaction, openPackage])

  const handleNetworkChange = useCallback((n: Network) => {
    setNetwork(n)
  }, [])

  const handleSelectProtocol = useCallback((protocol: Protocol) => {
    openProtocol(protocol)
  }, [openProtocol])

  const handleExplorePackage = useCallback((packageId: string) => {
    openPackage(packageId)
  }, [openPackage])

  const handleExploreObject = useCallback((objectId: string) => {
    openObject(objectId)
  }, [openObject])

  const handleProtocolLoadPackage = useCallback((packageId: string) => {
    pkg.fetchPackage(packageId)
  }, [pkg])

  const handleObjectFromTx = useCallback((id: string) => {
    openObject(id)
  }, [openObject])

  const currentLoading = useMemo(() => {
    if (searchMode === 'object') return objectGraph.loading
    if (searchMode === 'transaction') return transaction.loading
    return pkg.loading
  }, [searchMode, objectGraph.loading, transaction.loading, pkg.loading])

  const showSearchBar = !['home', 'directory', 'protocol'].includes(mode)

  type NavKey = 'home' | 'directory' | 'transactions' | 'packages'
  const navItems: { key: NavKey; label: string }[] = [
    { key: 'home', label: 'Home' },
    { key: 'directory', label: 'Directory' },
    { key: 'transactions', label: 'Transactions' },
    { key: 'packages', label: 'Packages' },
  ]

  const activeNav = useMemo<NavKey>(() => {
    if (mode === 'home') return 'home'
    if (mode === 'directory' || mode === 'protocol') return 'directory'
    if (mode === 'package') return 'packages'
    return 'transactions'
  }, [mode])

  const handleNavClick = useCallback((target: NavKey) => {
    switch (target) {
      case 'home':
        setMode('home')
        updateUrl('home', '', network)
        break
      case 'directory':
        setMode('directory')
        updateUrl('directory', '', network)
        break
      case 'transactions':
        setSearchMode('transaction')
        setMode('transaction')
        updateUrl('transaction', '', network)
        break
      case 'packages':
        setSearchMode('package')
        setMode('package')
        updateUrl('package', '', network)
        break
    }
  }, [network, setMode, setSearchMode])

  const handleHomeClick = useCallback(() => {
    setHistoryStack([])
    setSelectedProtocol(null)
    setMode('home')
    setAnalysis(null)
    updateUrl('home', '', network)
  }, [network])

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0d1117] overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-[#30363d] bg-[#0d1117] z-10 flex-shrink-0">
        {/* Back button */}
        {canGoBack && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#30363d]
              text-xs text-gray-300 hover:text-white hover:border-[#6fbcf0] transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
        )}

        {/* Logo — always clickable to go home */}
        <button
          onClick={handleHomeClick}
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
                onClick={() => {
                  setSearchMode(m)
                  setMode(m as Mode)
                }}
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

      <div className="border-b border-[#1f2937] bg-[#0b1220] px-4">
        <nav className="flex items-center gap-2 py-2 overflow-x-auto">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => handleNavClick(item.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap
                ${activeNav === item.key
                  ? 'bg-[#6fbcf0] text-[#0d1117]'
                  : 'text-gray-400 hover:text-white border border-transparent hover:border-[#30363d]'
                }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <main className="flex-1 flex overflow-hidden">
        {mode === 'home' && (
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            <ChainHero network={network} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <article className="bg-[#0b1220] border border-[#1f2937] rounded-2xl p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Coming Soon</p>
                <h3 className="text-white text-xl font-semibold mt-1">Finality Rings</h3>
                <p className="text-sm text-gray-400 mt-2">
                  Orbit-style visualization that maps finality latency and consensus health in real time.
                </p>
              </article>
              <article className="bg-[#0b1220] border border-[#1f2937] rounded-2xl p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Coming Soon</p>
                <h3 className="text-white text-xl font-semibold mt-1">Chain Terrain</h3>
                <p className="text-sm text-gray-400 mt-2">
                  Package “topography” driven by live activity so hotspots ripple across a 3D landscape.
                </p>
              </article>
            </div>
          </div>
        )}

        {mode === 'directory' && (
          <Directory
            onSelectProtocol={handleSelectProtocol}
            onSelectEntry={(entry) => {
              if (entry.official) {
                handleSelectProtocol(entry.official)
              } else if (entry.website) {
                window.open(entry.website, '_blank', 'noopener,noreferrer')
              }
            }}
          />
        )}

        {mode === 'protocol' && selectedProtocol && (
          <ProtocolDetail
            protocol={selectedProtocol}
            packageState={pkg}
            analysis={analysis}
            onBack={handleBack}
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
              <ObjectPanel
                data={objectGraph.objectData}
                onClose={() => setPanelOpen(false)}
                onTxClick={handleTxClick}
              />
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
