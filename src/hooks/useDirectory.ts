import { useState, useEffect, useMemo } from 'react'
import { PROTOCOLS, type Protocol } from '../data/protocols'
import { useDeFiLlama, type DeFiLlamaProtocol } from './useDeFiLlama'

export type BadgeTier = 'official' | 'verified' | 'unclaimed'

export interface DirectoryEntry {
  tier: BadgeTier
  // Official entries use Protocol; others synthesised from DeFiLlama
  official?: Protocol
  // DeFiLlama data (all tiers may have this)
  llama?: DeFiLlamaProtocol
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
  const [entries, setEntries] = useState<DirectoryEntry[]>([])

  useEffect(() => {
    // Build a name → llama map for matching
    const llamaByName = new Map<string, DeFiLlamaProtocol>()
    for (const lp of llamaProtocols) {
      llamaByName.set(normalise(lp.name), lp)
    }

    const result: DirectoryEntry[] = []
    const usedLlamaIds = new Set<string>()

    // 1. Official entries — try to match with DeFiLlama for TVL enrichment
    for (const protocol of PROTOCOLS) {
      const llamaMatch = llamaByName.get(normalise(protocol.name))
        ?? llamaByName.get(normalise(protocol.name.replace(/\s+protocol$/i, '')))

      if (llamaMatch) usedLlamaIds.add(llamaMatch.id)

      result.push({
        tier: 'official',
        official: protocol,
        llama: llamaMatch,
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
      })
    }

    // 2. DeFiLlama-discovered protocols not in our official list
    //    These start as 'unclaimed' — the user can claim them
    if (llamaProtocols.length > 0) {
      for (const lp of llamaProtocols) {
        if (usedLlamaIds.has(lp.id)) continue // already matched
        if (!lp.tvl || lp.tvl < 10_000) continue // skip dust protocols

        const style = styleForCategory(lp.category)

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
        })
      }
    }

    // Sort: official first, then by TVL desc
    result.sort((a, b) => {
      if (a.tier === 'official' && b.tier !== 'official') return -1
      if (b.tier === 'official' && a.tier !== 'official') return 1
      return (b.tvl ?? 0) - (a.tvl ?? 0)
    })

    setEntries(result)
  }, [llamaProtocols])

  const stats = useMemo(() => ({
    total: entries.length,
    official: entries.filter((e) => e.tier === 'official').length,
    verified: entries.filter((e) => e.tier === 'verified').length,
    unclaimed: entries.filter((e) => e.tier === 'unclaimed').length,
    totalTvl: entries.reduce((sum, e) => sum + (e.tvl ?? 0), 0),
  }), [entries])

  return { entries, loading: llamaLoading, error: llamaError, stats }
}
