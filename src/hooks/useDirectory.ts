import { useState, useEffect, useMemo } from 'react'
import { PROTOCOLS, type Protocol } from '../data/protocols'
import { useDeFiLlama, type DeFiLlamaProtocol } from './useDeFiLlama'
import { useOnChainMetrics, type ProtocolMetrics } from './useOnChainMetrics'

export type BadgeTier = 'official' | 'verified' | 'unclaimed'

export interface DirectoryEntry {
  tier: BadgeTier
  // Official entries use Protocol; others synthesised from DeFiLlama
  official?: Protocol
  // DeFiLlama data (all tiers may have this)
  llama?: DeFiLlamaProtocol
  // On-chain metrics (official only)
  onChain?: ProtocolMetrics
  // Derived display fields
  id: string
  name: string
  tagline: string
  category: string
  color: string
  colorTo: string
  emoji: string
  website: string
  tvlUsd: string
  tvl: number | null
  logo?: string
  // Composite popularity score (0–100)
  popularityScore: number
}

/** Normalise name for fuzzy matching between our list and DeFiLlama */
function normalise(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// DeFiLlama category → emoji + color mapping
const CATEGORY_STYLE: Record<string, { emoji: string; color: string; colorTo: string }> = {
  'Dexes':           { emoji: '🔄', color: '#06b6d4', colorTo: '#0891b2' },
  'Lending':         { emoji: '🏦', color: '#8b5cf6', colorTo: '#6d28d9' },
  'Liquid Staking':  { emoji: '💧', color: '#3b82f6', colorTo: '#1d4ed8' },
  'Yield':           { emoji: '🌾', color: '#10b981', colorTo: '#059669' },
  'Bridge':          { emoji: '🌉', color: '#f59e0b', colorTo: '#d97706' },
  'Derivatives':     { emoji: '📈', color: '#ef4444', colorTo: '#dc2626' },
  'Yield Aggregator':{ emoji: '🧩', color: '#a78bfa', colorTo: '#7c3aed' },
  'RWA':             { emoji: '🏛️', color: '#6b7280', colorTo: '#4b5563' },
  'CDP':             { emoji: '🪙', color: '#f97316', colorTo: '#ea580c' },
  'NFT Marketplace': { emoji: '🖼️', color: '#ec4899', colorTo: '#db2777' },
  'Gaming':          { emoji: '🎮', color: '#22c55e', colorTo: '#16a34a' },
  'Options':         { emoji: '⚡', color: '#eab308', colorTo: '#ca8a04' },
  'Launchpad':       { emoji: '🚀', color: '#6366f1', colorTo: '#4f46e5' },
}

function styleForCategory(cat: string) {
  return CATEGORY_STYLE[cat] ?? { emoji: '🔗', color: '#6fbcf0', colorTo: '#3b82f6' }
}

export function useDirectory() {
  const { protocols: llamaProtocols, loading: llamaLoading, error: llamaError } = useDeFiLlama()
  const { metrics: onChainMetrics, loading: metricsLoading } = useOnChainMetrics()
  const [entries, setEntries] = useState<DirectoryEntry[]>([])

  useEffect(() => {
    // Build a name → llama map for matching
    const llamaByName = new Map<string, DeFiLlamaProtocol>()
    for (const lp of llamaProtocols) {
      llamaByName.set(normalise(lp.name), lp)
    }

    const result: DirectoryEntry[] = []
    const usedLlamaIds = new Set<string>()

    // --- Max TVL across all protocols (for normalising score) ---
    const maxTvl = Math.max(...llamaProtocols.map((p) => p.tvl ?? 0), 1)

    // 1. Official entries — enriched with DeFiLlama TVL + on-chain metrics
    for (const protocol of PROTOCOLS) {
      const llamaMatch = llamaByName.get(normalise(protocol.name))
        ?? llamaByName.get(normalise(protocol.name.replace(/\s+protocol$/i, '')))

      if (llamaMatch) usedLlamaIds.add(llamaMatch.id)

      const onChain = onChainMetrics.get(protocol.id)
      const tvl = llamaMatch?.tvl ?? 0

      // Composite score: 60% TVL rank + 40% on-chain activity
      const tvlScore = (tvl / maxTvl) * 60
      const activityScore = (onChain?.popularityScore ?? 0) * 0.4
      const popularityScore = Math.round(tvlScore + activityScore)

      result.push({
        tier: 'official',
        official: protocol,
        llama: llamaMatch,
        onChain,
        id: protocol.id,
        name: protocol.name,
        tagline: protocol.tagline,
        category: protocol.category,
        color: protocol.color,
        colorTo: protocol.colorTo,
        emoji: protocol.emoji,
        website: protocol.website,
        tvlUsd: llamaMatch?.tvlUsd ?? '—',
        tvl: llamaMatch?.tvl ?? null,
        logo: llamaMatch?.logo,
        popularityScore,
      })
    }

    // 2. DeFiLlama-discovered unclaimed protocols
    if (llamaProtocols.length > 0) {
      for (const lp of llamaProtocols) {
        if (usedLlamaIds.has(lp.id)) continue
        if (!lp.tvl || lp.tvl < 10_000) continue

        const style = styleForCategory(lp.category)
        const popularityScore = Math.round(((lp.tvl ?? 0) / maxTvl) * 60)

        result.push({
          tier: 'unclaimed',
          llama: lp,
          id: `llama-${lp.id}`,
          name: lp.name,
          tagline: lp.description ?? `${lp.category} protocol on Sui`,
          category: lp.category,
          color: style.color,
          colorTo: style.colorTo,
          emoji: style.emoji,
          website: lp.website,
          tvlUsd: lp.tvlUsd,
          tvl: lp.tvl,
          logo: lp.logo,
          popularityScore,
        })
      }
    }

    // Sort: official first, then popularity score desc
    result.sort((a, b) => {
      if (a.tier === 'official' && b.tier !== 'official') return -1
      if (b.tier === 'official' && a.tier !== 'official') return 1
      return b.popularityScore - a.popularityScore
    })

    setEntries(result)
  }, [llamaProtocols, onChainMetrics])

  const stats = useMemo(() => ({
    total: entries.length,
    official: entries.filter((e) => e.tier === 'official').length,
    verified: entries.filter((e) => e.tier === 'verified').length,
    unclaimed: entries.filter((e) => e.tier === 'unclaimed').length,
    totalTvl: entries.reduce((sum, e) => sum + (e.tvl ?? 0), 0),
  }), [entries])

  return { entries, loading: llamaLoading || metricsLoading, error: llamaError, stats }
}
