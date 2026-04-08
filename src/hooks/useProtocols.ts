/**
 * Fetches published protocols from Supabase.
 * Falls back to the hardcoded list if Supabase isn't reachable.
 */
import { useEffect, useState } from 'react'
import { supabase, type DbProtocol } from '../lib/supabase'
import { PROTOCOLS as HARDCODED } from '../data/protocols'
import type { Protocol } from '../data/protocols'

function dbToProtocol(p: DbProtocol): Protocol {
  return {
    id: p.id,
    name: p.name,
    tagline: p.tagline,
    description: p.description,
    category: p.category as Protocol['category'],
    color: p.color,
    colorTo: p.color_to,
    emoji: p.emoji,
    website: p.website ?? '',
    github: p.github ?? undefined,
    twitter: p.twitter ?? undefined,
    packages: p.packages,
    keyObjects: p.key_objects,
    tags: p.tags,
    featured: p.featured,
  }
}

export function useProtocols() {
  const [protocols, setProtocols] = useState<Protocol[]>(HARDCODED)
  const [loading, setLoading] = useState(true)
  const [fromDb, setFromDb] = useState(false)

  useEffect(() => {
    async function fetch() {
      try {
        const { data, error } = await supabase
          .from('protocols')
          .select('*')
          .eq('status', 'published')
          .order('name')

        if (error || !data || data.length === 0) {
          // Fall back to hardcoded
          setProtocols(HARDCODED)
        } else {
          setProtocols((data as DbProtocol[]).map(dbToProtocol))
          setFromDb(true)
        }
      } catch {
        setProtocols(HARDCODED)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return { protocols, loading, fromDb }
}
