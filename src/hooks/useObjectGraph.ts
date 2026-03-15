import { useState, useCallback } from 'react'
import type { SuiObjectResponse, DynamicFieldInfo } from '@mysten/sui/jsonRpc'
import { getClient, type Network } from '../lib/suiClient'
import { buildGraph, type GraphData } from '../lib/graphBuilder'

export interface ObjectGraphState {
  loading: boolean
  error: string | null
  objectData: SuiObjectResponse | null
  graphData: GraphData | null
  currentId: string
}

export function useObjectGraph(network: Network) {
  const [state, setState] = useState<ObjectGraphState>({
    loading: false,
    error: null,
    objectData: null,
    graphData: null,
    currentId: '',
  })

  const fetchObject = useCallback(
    async (objectId: string, onNodeClick: (id: string) => void, onTxClick?: (digest: string) => void) => {
      const trimmed = objectId.trim()
      if (!trimmed) return

      setState((prev) => ({ ...prev, loading: true, error: null, currentId: trimmed }))

      try {
        const client = getClient(network)

        // 1. Fetch the primary object
        const objectResponse = await client.getObject({
          id: trimmed,
          options: {
            showContent: true,
            showOwner: true,
            showType: true,
            showPreviousTransaction: true,
            showDisplay: true,
          },
        })

        if (objectResponse.error) {
          throw new Error(
            typeof objectResponse.error === 'string'
              ? objectResponse.error
              : JSON.stringify(objectResponse.error)
          )
        }

        if (!objectResponse.data) {
          throw new Error('Object not found')
        }

        // 2. Fetch dynamic fields (child objects)
        let dynamicFields: DynamicFieldInfo[] = []
        try {
          const dfResponse = await client.getDynamicFields({ parentId: trimmed })
          dynamicFields = dfResponse.data
        } catch {
          // Not all objects have dynamic fields — swallow the error
        }

        // 3. Extract referenced object IDs from fields and batch-fetch them
        let referencedObjects: SuiObjectResponse[] = []
        const content = objectResponse.data.content
        if (content && 'fields' in content) {
          const idPattern = /0x[a-fA-F0-9]{64}/g
          const fieldsStr = JSON.stringify(content.fields)
          const matches = [...fieldsStr.matchAll(idPattern)].map((m) => m[0])
          const uniqueIds = [...new Set(matches)].filter(
            (id) => id !== trimmed
          ).slice(0, 10) // cap at 10 to avoid overloading the RPC

          if (uniqueIds.length > 0) {
            try {
              referencedObjects = await client.multiGetObjects({
                ids: uniqueIds,
                options: { showType: true, showContent: false },
              })
            } catch {
              // Best-effort
            }
          }
        }

        // 4. Build graph
        const graphData = buildGraph(
          objectResponse,
          dynamicFields,
          referencedObjects,
          onNodeClick,
          onTxClick
        )

        setState({
          loading: false,
          error: null,
          objectData: objectResponse,
          graphData,
          currentId: trimmed,
        })
      } catch (err) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        }))
      }
    },
    [network]
  )

  return { ...state, fetchObject }
}
