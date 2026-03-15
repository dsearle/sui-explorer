import { useState, useMemo } from 'react'
import { PROTOCOLS, CATEGORIES, type Protocol, type ProtocolCategory } from '../data/protocols'

interface Props {
  onSelectProtocol: (protocol: Protocol) => void
  onSearchPackage: (packageId: string) => void
}

const CATEGORY_COLORS: Record<ProtocolCategory, string> = {
  DeFi: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  Lending: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  DEX: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  NFT: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
  Infrastructure: 'text-[#6fbcf0] bg-[#6fbcf0]/10 border-[#6fbcf0]/20',
  Gaming: 'text-green-400 bg-green-400/10 border-green-400/20',
  Staking: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  Bridge: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
}

function ProtocolCard({ protocol, onSelect }: { protocol: Protocol; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative group cursor-pointer rounded-2xl border border-[#30363d] bg-[#0d1117]
        overflow-hidden transition-all duration-300 hover:border-opacity-60 hover:shadow-2xl
        hover:-translate-y-0.5"
      style={{
        boxShadow: hovered
          ? `0 0 30px ${protocol.color}20, 0 4px 20px rgba(0,0,0,0.4)`
          : '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      {/* Gradient header strip */}
      <div
        className="h-1.5 w-full"
        style={{ background: `linear-gradient(90deg, ${protocol.color}, ${protocol.colorTo})` }}
      />

      {/* Glow effect on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{
          background: `radial-gradient(ellipse at top left, ${protocol.color}08 0%, transparent 60%)`,
        }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${protocol.color}30, ${protocol.colorTo}20)` }}
            >
              {protocol.emoji}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{protocol.name}</h3>
              <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-0.5
                ${CATEGORY_COLORS[protocol.category]}`}>
                {protocol.category}
              </span>
            </div>
          </div>
          {protocol.featured && (
            <span className="text-[10px] bg-[#6fbcf0]/10 text-[#6fbcf0] border border-[#6fbcf0]/20
              px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
              Featured
            </span>
          )}
        </div>

        {/* Tagline */}
        <p className="text-xs text-gray-400 leading-relaxed mb-4 line-clamp-2">
          {protocol.tagline}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: protocol.color }} />
            <span className="text-[10px] text-gray-500">
              {protocol.packages.length} package{protocol.packages.length !== 1 ? 's' : ''}
            </span>
          </div>
          {protocol.keyObjects && protocol.keyObjects.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
              <span className="text-[10px] text-gray-500">
                {protocol.keyObjects.length} key object{protocol.keyObjects.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {protocol.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-[#21262d] text-gray-500 font-mono">
              {tag}
            </span>
          ))}
        </div>

        {/* Explore button */}
        <div className="mt-4 pt-3 border-t border-[#21262d] flex items-center justify-between">
          <span className="text-xs text-gray-500">Click to explore</span>
          <div
            className="flex items-center gap-1 text-xs font-semibold transition-colors"
            style={{ color: protocol.color }}
          >
            Explore
            <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none"
              viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

function HeroSection() {
  return (
    <div className="relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#6fbcf0 1px, transparent 1px), linear-gradient(90deg, #6fbcf0 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top, #6fbcf0 0%, transparent 70%)' }}
      />

      <div className="relative px-8 pt-12 pb-8 text-center max-w-3xl mx-auto">
        {/* Logo mark */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6fbcf0, #3b82f6)' }}>
            <svg viewBox="0 0 32 32" className="w-9 h-9 text-white" fill="currentColor">
              <circle cx="16" cy="6" r="4" />
              <circle cx="6" cy="22" r="4" />
              <circle cx="26" cy="22" r="4" />
              <line x1="16" y1="10" x2="8" y2="20" stroke="white" strokeWidth="1.5" opacity="0.7" />
              <line x1="16" y1="10" x2="24" y2="20" stroke="white" strokeWidth="1.5" opacity="0.7" />
              <line x1="8" y1="24" x2="24" y2="24" stroke="white" strokeWidth="1.5" opacity="0.4" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
          Sui Object Explorer
        </h1>
        <p className="text-base text-gray-400 leading-relaxed mb-2">
          Explore Sui blockchain protocols, packages, objects, and transactions.
          Understand what any on-chain thing actually <em className="text-gray-300 not-italic font-medium">does</em>.
        </p>
        <p className="text-sm text-gray-500">
          Select a protocol below, or use the search bar above to explore any object, transaction, or package directly.
        </p>
      </div>
    </div>
  )
}

export function Directory({ onSelectProtocol, onSearchPackage }: Props) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<ProtocolCategory | 'All'>('All')

  const filtered = useMemo(() => {
    return PROTOCOLS.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.tagline.toLowerCase().includes(search.toLowerCase()) ||
        p.tags.some((t) => t.includes(search.toLowerCase()))
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [search, activeCategory])

  const usedCategories = useMemo(() => {
    const cats = new Set(PROTOCOLS.map((p) => p.category))
    return CATEGORIES.filter((c) => cats.has(c))
  }, [])

  void onSearchPackage // referenced via props; kept for future use

  return (
    <div className="flex-1 overflow-y-auto">
      <HeroSection />

      {/* Filter bar */}
      <div className="sticky top-0 z-10 bg-[#0d1117]/95 backdrop-blur border-b border-[#30363d] px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter protocols…"
              className="w-full bg-[#161b22] border border-[#30363d] rounded-lg pl-9 pr-3 py-2
                text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#6fbcf0] transition-colors"
            />
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveCategory('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${activeCategory === 'All'
                  ? 'bg-[#6fbcf0] text-[#0d1117] font-semibold'
                  : 'bg-[#161b22] text-gray-400 border border-[#30363d] hover:text-white'
                }`}
            >
              All ({PROTOCOLS.length})
            </button>
            {usedCategories.map((cat) => {
              const count = PROTOCOLS.filter((p) => p.category === cat).length
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                    ${activeCategory === cat
                      ? 'bg-[#6fbcf0] text-[#0d1117] font-semibold'
                      : 'bg-[#161b22] text-gray-400 border border-[#30363d] hover:text-white'
                    }`}
                >
                  {cat} ({count})
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Protocol grid */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-3xl mb-3">🔍</div>
            <p>No protocols match "{search}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((protocol) => (
              <ProtocolCard
                key={protocol.id}
                protocol={protocol}
                onSelect={() => onSelectProtocol(protocol)}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-[#21262d] text-center">
          <p className="text-xs text-gray-600">
            Know a protocol that should be listed?{' '}
            <a
              href="https://github.com/dsearle/sui-explorer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#6fbcf0] hover:underline"
            >
              Open a PR on GitHub
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
