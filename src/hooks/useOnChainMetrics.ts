import { useState, useEffect } from 'react'
import { getClient } from '../lib/suiClient'
import { PROTOCOLS } from '../data/protocols'

export interface ObjectMetrics {
  objectId: string
  version: number        // mutation count — direct proxy for usage
  lastTxDigest: string
  lastTxAge?: string     // human-readable, e.g. "2h ago"
}

export interface ProtocolMetrics {
  protocolId: string
  topObject?: ObjectMetrics   // highest-version key object
  totalMutations: number      // sum across all key objects
  activityTier: 'hot' | 'active' | 'moderate' | 'low' | 'unknown'
  activityLabel: string
  activityColor: string
  popularityScore: number     // 0–100 composite (version rank)
}

function tier(mutations: number): ProtocolMetrics['activityTier'] {
  if (mutations >= 1_000_000) return 'hot'
  if (mutations >= 100_000)   return 'active'
  if (mutations >= 10_000)    return 'moderate'
  if (mutations > 0)          return 'low'
  return 'unknown'
}

const TIER_META: Record<ProtocolMetrics['activityTier'], { label: string; color: string }> = {
  hot:      { label: '🔥 Hot',      color: '#ef4444' },
  active:   { label: '⚡ Active',   color: '#f59e0b' },
  moderate: { label: '📈 Growing',  color: '#6fbcf0' },
  low:      { label: '🌱 Early',    color: '#34d399' },
  unknown:  { label: '—',           color: '#4b5563' },
}


export function useOnChainMetrics() {
  const [metrics, setMetrics] = useState<Map<string, ProtocolMetrics>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchAll() {
      const client = getClient('mainnet')
      const result = new Map<string, ProtocolMetrics>()

      // Fetch all protocols with key objects in parallel batches
      const protocolsWithObjects = PROTOCOLS.filter((p) => p.keyObjects && p.keyObjects.length > 0)

      // Batch all object IDs
      const allObjectIds = protocolsWithObjects.flatMap((p) =>
        (p.keyObjects ?? []).map((o) => ({ protocolId: p.id, objectId: o.id, label: o.label }))
      )

      // Fetch in batches of 10 (RPC rate limit safety)
      const batchSize = 10
      const fetchedVersions = new Map<string, { version: number; digest: string }>()

      for (let i = 0; i < allObjectIds.length; i += batchSize) {
        if (cancelled) return
        const batch = allObjectIds.slice(i, i + batchSize)
        try {
          const responses = await client.multiGetObjects({
            ids: batch.map((b) => b.objectId),
            options: { showOwner: false, showContent: false },
          })
          responses.forEach((resp, idx) => {
            if (resp.data) {
              fetchedVersions.set(batch[idx].objectId, {
                version: parseInt(resp.data.version, 10),
                digest: resp.data.previousTransaction ?? '',
              })
            }
          })
        } catch {
          // Best-effort — skip failed batches
        }
      }

      // Compute per-protocol metrics
      for (const protocol of protocolsWithObjects) {
        const keyObjs = protocol.keyObjects ?? []
        const objMetrics: ObjectMetrics[] = []

        for (const keyObj of keyObjs) {
          const fetched = fetchedVersions.get(keyObj.id)
          if (fetched) {
            objMetrics.push({
              objectId: keyObj.id,
              version: fetched.version,
              lastTxDigest: fetched.digest,
            })
          }
        }

        if (objMetrics.length === 0) continue

        // Use the highest-version object as the headline metric
        const topObject = objMetrics.reduce((best, cur) =>
          cur.version > best.version ? cur : best
        )

        const totalMutations = objMetrics.reduce((sum, o) => sum + o.version, 0)
        const t = tier(topObject.version)
        const meta = TIER_META[t]

        result.set(protocol.id, {
          protocolId: protocol.id,
          topObject,
          totalMutations,
          activityTier: t,
          activityLabel: meta.label,
          activityColor: meta.color,
          popularityScore: 0, // computed after all fetched
        })
      }

      // Rank by totalMutations → normalise to 0–100
      const sorted = [...result.values()].sort((a, b) => b.totalMutations - a.totalMutations)
      sorted.forEach((m, idx) => {
        m.popularityScore = Math.round(((sorted.length - idx) / sorted.length) * 100)
      })

      if (!cancelled) {
        setMetrics(result)
        setLoading(false)
      }
    }

    fetchAll()
    return () => { cancelled = true }
  }, [])

  return { metrics, loading }
}
