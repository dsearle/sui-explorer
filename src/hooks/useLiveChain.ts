import { useEffect, useRef, useState } from 'react'
import type { Network } from '../lib/suiClient'
import { getClient } from '../lib/suiClient'

export interface LiveBlock {
  sequence: string
  timestamp: number
  txCount: number
  epoch: string
  transactions: string[]
  networkTotalTransactions: number
}

interface LiveChainState {
  blocks: LiveBlock[]
  loading: boolean
  error: string | null
}

const MAX_BLOCKS = 24
const POLL_INTERVAL = 5000

export function useLiveChain(network: Network): LiveChainState {
  const [state, setState] = useState<LiveChainState>({
    blocks: [],
    loading: true,
    error: null,
  })
  const lastSeqRef = useRef<string>('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const client = getClient(network)
    let cancelled = false

    async function fetchLatest() {
      try {
        const latestSeq = await client.getLatestCheckpointSequenceNumber()
        if (cancelled) return

        if (latestSeq !== lastSeqRef.current) {
          lastSeqRef.current = latestSeq
          const checkpoint = await client.getCheckpoint({ id: latestSeq })
          if (!checkpoint) return

          const block: LiveBlock = {
            sequence: latestSeq,
            timestamp: Number(checkpoint.timestampMs ?? Date.now()),
            txCount: checkpoint.transactions?.length ?? 0,
            epoch: checkpoint.epoch?.toString() ?? '0',
            transactions: checkpoint.transactions ?? [],
            networkTotalTransactions: Number(checkpoint.networkTotalTransactions ?? 0),
          }

          setState((prev) => ({
            blocks: [block, ...prev.blocks].slice(0, MAX_BLOCKS),
            loading: false,
            error: null,
          }))
        }
      } catch (err) {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            error: err instanceof Error ? err.message : 'Failed to load live data',
            loading: false,
          }))
        }
      } finally {
        if (!cancelled) {
          setState((prev) => (prev.loading ? { ...prev, loading: false } : prev))
          timerRef.current = setTimeout(fetchLatest, POLL_INTERVAL)
        }
      }
    }

    fetchLatest()

    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = null
      lastSeqRef.current = ''
    }
  }, [network])

  return state
}
