import { useState, useEffect } from 'react'

export type VerificationStatus = 'official' | 'verified' | 'unclaimed' | 'unverified'

export interface DeFiLlamaProtocol {
  id: string
  name: string
  slug: string
  logo: string
  tvl: number | null
  tvlUsd: string       // formatted, e.g. "$1.2B"
  website: string
  twitter?: string
  github?: string[]
  category: string
  chains: string[]
  address?: string     // on-chain address if listed
  description?: string
}

const TVL_ENDPOINT = 'https://api.llama.fi/protocols'

function formatTvl(tvl: number | null): string {
  if (!tvl || tvl <= 0) return '—'
  if (tvl >= 1_000_000_000) return `$${(tvl / 1_000_000_000).toFixed(2)}B`
  if (tvl >= 1_000_000) return `$${(tvl / 1_000_000).toFixed(1)}M`
  if (tvl >= 1_000) return `$${(tvl / 1_000).toFixed(0)}K`
  return `$${tvl.toFixed(0)}`
}

export function useDeFiLlama() {
  const [protocols, setProtocols] = useState<DeFiLlamaProtocol[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetch() {
      try {
        const resp = await window.fetch(TVL_ENDPOINT)
        if (!resp.ok) throw new Error(`DeFiLlama returned ${resp.status}`)
        const all = await resp.json() as Array<{
          id: string
          name: string
          slug: string
          logo: string
          tvl: number
          url: string
          twitter?: string
          github?: string[]
          category: string
          chains: string[]
          address?: string
          description?: string
        }>

        if (cancelled) return

        // Filter to Sui protocols only, sort by TVL desc
        const sui = all
          .filter((p) => p.chains?.includes('Sui'))
          .sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0))
          .map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            logo: p.logo,
            tvl: p.tvl ?? null,
            tvlUsd: formatTvl(p.tvl ?? null),
            website: p.url,
            twitter: p.twitter,
            github: p.github,
            category: p.category,
            chains: p.chains,
            address: p.address,
            description: p.description,
          }))

        setProtocols(sui)
        setLoading(false)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load DeFiLlama data')
          setLoading(false)
        }
      }
    }

    fetch()
    return () => { cancelled = true }
  }, [])

  return { protocols, loading, error }
}
