import { useState, useCallback } from 'react'
import type { SuiTransactionBlockResponse } from '@mysten/sui/jsonRpc'
import { getClient, type Network } from '../lib/suiClient'

export interface TransactionState {
  loading: boolean
  error: string | null
  data: SuiTransactionBlockResponse | null
  currentDigest: string
}

export function useTransaction(network: Network) {
  const [state, setState] = useState<TransactionState>({
    loading: false,
    error: null,
    data: null,
    currentDigest: '',
  })

  const fetchTransaction = useCallback(
    async (digest: string) => {
      const trimmed = digest.trim()
      if (!trimmed) return

      setState({ loading: true, error: null, data: null, currentDigest: trimmed })

      try {
        const client = getClient(network)
        const data = await client.getTransactionBlock({
          digest: trimmed,
          options: {
            showInput: true,
            showEffects: true,
            showEvents: true,
            showObjectChanges: true,
            showBalanceChanges: true,
          },
        })
        setState({ loading: false, error: null, data, currentDigest: trimmed })
      } catch (err) {
        setState({
          loading: false,
          error: err instanceof Error ? err.message : 'Transaction not found',
          data: null,
          currentDigest: trimmed,
        })
      }
    },
    [network]
  )

  return { ...state, fetchTransaction }
}
