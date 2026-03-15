import { useState, useCallback } from 'react'
import type { SuiMoveNormalizedModule } from '@mysten/sui/jsonRpc'
import { getClient, type Network } from '../lib/suiClient'

export interface PackageState {
  loading: boolean
  error: string | null
  modules: Record<string, SuiMoveNormalizedModule> | null
  selectedModule: string | null
  packageId: string
}

export function usePackage(network: Network) {
  const [state, setState] = useState<PackageState>({
    loading: false,
    error: null,
    modules: null,
    selectedModule: null,
    packageId: '',
  })

  const fetchPackage = useCallback(
    async (packageId: string) => {
      const trimmed = packageId.trim()
      if (!trimmed) return

      setState({ loading: true, error: null, modules: null, selectedModule: null, packageId: trimmed })

      try {
        const client = getClient(network)
        const modules = await client.getNormalizedMoveModulesByPackage({ package: trimmed })
        const firstModule = Object.keys(modules)[0] ?? null
        setState({
          loading: false,
          error: null,
          modules,
          selectedModule: firstModule,
          packageId: trimmed,
        })
      } catch (err) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Package not found',
          modules: null,
        }))
      }
    },
    [network]
  )

  const selectModule = useCallback((moduleName: string) => {
    setState((prev) => ({ ...prev, selectedModule: moduleName }))
  }, [])

  return { ...state, fetchPackage, selectModule }
}
