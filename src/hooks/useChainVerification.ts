import { useState, useCallback } from 'react'
import { getClient } from '../lib/suiClient'

/** Cache so we don't re-verify the same package IDs repeatedly */
const verificationCache = new Map<string, boolean>()

export function useChainVerification() {
  const [verifying, setVerifying] = useState<Set<string>>(new Set())
  const [results, setResults] = useState<Map<string, boolean>>(new Map())

  const verify = useCallback(async (packageId: string): Promise<boolean> => {
    if (verificationCache.has(packageId)) {
      const cached = verificationCache.get(packageId)!
      setResults((prev) => new Map(prev).set(packageId, cached))
      return cached
    }

    setVerifying((prev) => new Set(prev).add(packageId))

    try {
      const client = getClient('mainnet')
      const modules = await client.getNormalizedMoveModulesByPackage({ package: packageId })
      const exists = modules && Object.keys(modules).length > 0
      verificationCache.set(packageId, exists)
      setResults((prev) => new Map(prev).set(packageId, exists))
      setVerifying((prev) => { const s = new Set(prev); s.delete(packageId); return s })
      return exists
    } catch {
      verificationCache.set(packageId, false)
      setResults((prev) => new Map(prev).set(packageId, false))
      setVerifying((prev) => { const s = new Set(prev); s.delete(packageId); return s })
      return false
    }
  }, [])

  return { verify, verifying, results }
}
