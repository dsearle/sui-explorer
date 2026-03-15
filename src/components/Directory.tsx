import { useState, useMemo } from 'react'
import { useDirectory, type DirectoryEntry, type BadgeTier } from '../hooks/useDirectory'
import { ClaimModal } from './ClaimModal'
import type { Protocol } from '../data/protocols'

interface Props {
  onSelectProtocol: (protocol: Protocol) => void
  onSelectEntry: (entry: DirectoryEntry) => void
}

// ─── Badge ──────────────────────────────────────────────────────────────────
const BADGE: Record<BadgeTier, { label: string; icon: string; className: string }> = {
  official:  { label: 'Official',  icon: '🏅', className: 'text-[#fbbf24] bg-[#fbbf24]/10 border-[#fbbf24]/20' },
  verified:  { label: 'Verified',  icon: '✅', className: 'text-[#34d399] bg-[#34d399]/10 border-[#34d399]/20' },
  unclaimed: { label: 'Unclaimed', icon: '🔍', className: 'text-gray-400 bg-gray-400/10 border-gray-400/20' },
}

// ─── Tier filter tabs ────────────────────────────────────────────────────────
const TIER_FILTERS: { id: BadgeTier | 'all'; label: string }[] = [
  { id: 'all',       label: 'All' },
  { id: 'official',  label: '🏅 Official' },
  { id: 'unclaimed', label: '🔍 Unclaimed' },
]

// ─── Format large TVL for ecosystem stats ───────────────────────────────────
function formatBigTvl(tvl: number): string {
  if (tvl >= 1_000_000_000) return `$${(tvl / 1_000_000_000).toFixed(1)}B`
  if (tvl >= 1_000_000) return `$${(tvl / 1_000_000).toFixed(0)}M`
  return `$${tvl.toLocaleString()}`
}

// ─── Card ────────────────────────────────────────────────────────────────────
function ProtocolCard({
  entry,
  onSelect,
  onClaim,
}: {
  entry: DirectoryEntry
  onSelect: () => void
  onClaim: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const badge = BADGE[entry.tier]
  const isUnclaimed = entry.tier === 'unclaimed'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative group rounded-2xl border border-[#30363d] bg-[#0d1117]
        overflow-hidden transition-all duration-300 hover:-translate-y-0.5
        ${isUnclaimed ? 'opacity-80 hover:opacity-100' : ''}`}
      style={{
        boxShadow: hovered
          ? `0 0 30px ${entry.color}25, 0 4px 20px rgba(0,0,0,0.4)`
          : '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      {/* Top gradient strip */}
      <div className="h-1 w-full"
        style={{ background: `linear-gradient(90deg, ${entry.color}, ${entry.colorTo})` }} />

      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity
        duration-500 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top left, ${entry.color}08, transparent 60%)` }} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            {/* Logo or emoji */}
            {entry.logo ? (
              <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-[#21262d]
                flex items-center justify-center border border-[#30363d]">
                <img src={entry.logo} alt="" className="w-7 h-7 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl
                flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${entry.color}30, ${entry.colorTo}20)` }}>
                {entry.emoji}
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">{entry.name}</h3>
              <span className="text-[10px] text-gray-500">{entry.category}</span>
            </div>
          </div>

          {/* Badge */}
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border
            flex-shrink-0 ${badge.className}`}>
            {badge.icon} {badge.label}
          </span>
        </div>

        {/* Tagline */}
        <p className="text-[11px] text-gray-400 leading-relaxed mb-3 line-clamp-2">
          {entry.tagline}
        </p>

        {/* Stats row: TVL + activity */}
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          {entry.tvlUsd && entry.tvlUsd !== '—' && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-600 uppercase tracking-wider">TVL</span>
              <span className="text-xs font-bold text-[#34d399]">{entry.tvlUsd}</span>
            </div>
          )}
          {entry.onChain && entry.onChain.activityTier !== 'unknown' && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-semibold"
                style={{ color: entry.onChain.activityColor }}>
                {entry.onChain.activityLabel}
              </span>
            </div>
          )}
          {entry.onChain?.topObject && (
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-[10px] text-gray-600">
                {entry.onChain.topObject.version.toLocaleString()} txs
              </span>
            </div>
          )}
        </div>

        {/* Action row */}
        <div className="pt-2.5 border-t border-[#21262d] flex items-center justify-between">
          {isUnclaimed ? (
            <>
              <span className="text-[10px] text-gray-600">Not yet curated</span>
              <button
                onClick={(e) => { e.stopPropagation(); onClaim() }}
                className="flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg
                  transition-colors bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/20
                  hover:bg-[#fbbf24]/20"
              >
                🙋 Claim
              </button>
            </>
          ) : (
            <>
              <span className="text-[10px] text-gray-600">Click to explore</span>
              <button
                onClick={onSelect}
                className="flex items-center gap-1 text-[10px] font-semibold transition-colors"
                style={{ color: entry.color }}
              >
                Explore
                <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Ecosystem stats bar ─────────────────────────────────────────────────────
function StatsBar({ stats, loading }: {
  stats: { total: number; official: number; unclaimed: number; totalTvl: number }
  loading: boolean
}) {
  return (
    <div className="flex items-center gap-6 flex-wrap justify-center text-center py-4">
      {[
        { label: 'Protocols', value: loading ? '…' : stats.total.toString() },
        { label: 'Official', value: loading ? '…' : stats.official.toString(), color: '#fbbf24' },
        { label: 'Unclaimed', value: loading ? '…' : stats.unclaimed.toString(), color: '#94a3b8' },
        { label: 'Total TVL', value: loading ? '…' : formatBigTvl(stats.totalTvl), color: '#34d399' },
      ].map(({ label, value, color }) => (
        <div key={label}>
          <div className="text-lg font-bold text-white" style={color ? { color } : undefined}>
            {value}
          </div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Hero ────────────────────────────────────────────────────────────────────
function HeroSection({ stats, loading }: { stats: ReturnType<typeof useDirectory>['stats']; loading: boolean }) {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#6fbcf0 1px, transparent 1px), linear-gradient(90deg, #6fbcf0 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-20
        pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top, #6fbcf0 0%, transparent 70%)' }} />

      <div className="relative px-8 pt-10 pb-4 text-center max-w-3xl mx-auto">
        <div className="flex items-center justify-center mb-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6fbcf0, #3b82f6)' }}>
            <svg viewBox="0 0 32 32" className="w-8 h-8 text-white" fill="currentColor">
              <circle cx="16" cy="6" r="4" />
              <circle cx="6" cy="22" r="4" />
              <circle cx="26" cy="22" r="4" />
              <line x1="16" y1="10" x2="8" y2="20" stroke="white" strokeWidth="1.5" opacity="0.7" />
              <line x1="16" y1="10" x2="24" y2="20" stroke="white" strokeWidth="1.5" opacity="0.7" />
              <line x1="8" y1="24" x2="24" y2="24" stroke="white" strokeWidth="1.5" opacity="0.4" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
          Sui Ecosystem Explorer
        </h1>
        <p className="text-sm text-gray-400 leading-relaxed">
          Every protocol, package, and object on Sui — curated, verified on-chain, and ranked by TVL.
        </p>

        <StatsBar stats={stats} loading={loading} />

        {/* Badge legend */}
        <div className="flex items-center justify-center gap-4 flex-wrap mt-1 mb-4">
          {Object.entries(BADGE).map(([tier, { icon, label, className }]) => (
            <span key={tier}
              className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${className}`}>
              {icon} {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────
export function Directory({ onSelectProtocol, onSelectEntry }: Props) {
  const { entries, loading, stats } = useDirectory()
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<BadgeTier | 'all'>('all')
  const [sortBy, setSortBy] = useState<'popularity' | 'tvl' | 'activity' | 'name'>('popularity')
  const [claimTarget, setClaimTarget] = useState<DirectoryEntry | null>(null)

  const filtered = useMemo(() => {
    const base = entries.filter((e) => {
      const matchesTier = tierFilter === 'all' || e.tier === tierFilter
      const matchesSearch = !search
        || e.name.toLowerCase().includes(search.toLowerCase())
        || e.category.toLowerCase().includes(search.toLowerCase())
        || e.tagline.toLowerCase().includes(search.toLowerCase())
      return matchesTier && matchesSearch
    })

    return [...base].sort((a, b) => {
      // Always pin official above unclaimed unless sorting by name
      if (sortBy !== 'name') {
        if (a.tier === 'official' && b.tier !== 'official') return -1
        if (b.tier === 'official' && a.tier !== 'official') return 1
      }
      switch (sortBy) {
        case 'tvl':        return (b.tvl ?? 0) - (a.tvl ?? 0)
        case 'activity':   return (b.onChain?.totalMutations ?? 0) - (a.onChain?.totalMutations ?? 0)
        case 'name':       return a.name.localeCompare(b.name)
        case 'popularity':
        default:           return b.popularityScore - a.popularityScore
      }
    })
  }, [entries, search, tierFilter, sortBy])

  const handleSelect = (entry: DirectoryEntry) => {
    if (entry.official) {
      onSelectProtocol(entry.official)
    } else {
      onSelectEntry(entry)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <HeroSection stats={stats} loading={loading} />

      {/* Filter bar */}
      <div className="sticky top-0 z-10 bg-[#0d1117]/95 backdrop-blur border-b
        border-[#30363d] px-6 py-3">
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
              placeholder="Search protocols…"
              className="w-full bg-[#161b22] border border-[#30363d] rounded-lg pl-9 pr-3 py-2
                text-xs text-white placeholder-gray-500 focus:outline-none
                focus:border-[#6fbcf0] transition-colors"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1 bg-[#161b22] border border-[#30363d]
            rounded-lg p-0.5">
            {([
              { id: 'popularity', label: '🏆 Popular' },
              { id: 'tvl',        label: '💰 TVL' },
              { id: 'activity',   label: '⚡ Activity' },
              { id: 'name',       label: 'A–Z' },
            ] as const).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setSortBy(id)}
                className={`px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-all
                  ${sortBy === id
                    ? 'bg-[#6fbcf0] text-[#0d1117] font-semibold'
                    : 'text-gray-400 hover:text-white'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tier filter */}
          <div className="flex items-center gap-1.5">
            {TIER_FILTERS.map(({ id, label }) => {
              const count = id === 'all'
                ? entries.length
                : entries.filter((e) => e.tier === id).length
              return (
                <button
                  key={id}
                  onClick={() => setTierFilter(id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                    ${tierFilter === id
                      ? 'bg-[#6fbcf0] text-[#0d1117] font-semibold'
                      : 'bg-[#161b22] text-gray-400 border border-[#30363d] hover:text-white'
                    }`}
                >
                  {label} ({loading ? '…' : count})
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading && entries.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-2 border-[#6fbcf0] border-t-transparent
                rounded-full animate-spin" />
              <span className="text-sm text-gray-400">Loading Sui ecosystem data…</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="text-3xl mb-3">🔍</div>
            <p>No protocols match your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((entry) => (
              <ProtocolCard
                key={entry.id}
                entry={entry}
                onSelect={() => handleSelect(entry)}
                onClaim={() => setClaimTarget(entry)}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-[#21262d] text-center space-y-2">
          <p className="text-xs text-gray-600">
            TVL data from{' '}
            <a href="https://defillama.com" target="_blank" rel="noopener noreferrer"
              className="text-[#6fbcf0] hover:underline">DeFiLlama</a>
            {' · '}
            Protocol data from Sui mainnet RPC
          </p>
          <p className="text-xs text-gray-600">
            Missing a protocol?{' '}
            <a href="https://github.com/dsearle/sui-explorer/issues/new?title=[Protocol+Claim]&labels=protocol-claim"
              target="_blank" rel="noopener noreferrer"
              className="text-[#6fbcf0] hover:underline">
              Open a claim on GitHub
            </a>
          </p>
        </div>
      </div>

      {/* Claim modal */}
      {claimTarget && (
        <ClaimModal
          entry={claimTarget}
          onClose={() => setClaimTarget(null)}
        />
      )}
    </div>
  )
}
