import { useMemo } from 'react'
import { useOnChainMetrics } from '../../hooks/useOnChainMetrics'
import { PROTOCOLS } from '../../data/protocols'
import type { Network } from '../../lib/suiClient'

export interface TerrainNode {
  id: string
  name: string
  emoji: string
  category: string
  color: string
  score: number        // 0–100 normalised activity
  mutations: number
  tier: 'hot' | 'active' | 'moderate' | 'low' | 'unknown'
}

export function useTerrainData(network: Network = 'mainnet') {
  const { metrics, loading } = useOnChainMetrics(network)

  const nodes = useMemo<TerrainNode[]>(() => {
    return PROTOCOLS.map((p) => {
      const m = metrics.get(p.id)
      return {
        id: p.id,
        name: p.name,
        emoji: p.emoji,
        category: p.category,
        color: p.color,
        score: m?.popularityScore ?? 0,
        mutations: m?.totalMutations ?? 0,
        tier: m?.activityTier ?? 'unknown',
      }
    }).sort((a, b) => b.score - a.score)
  }, [metrics])

  return { nodes, loading }
}
