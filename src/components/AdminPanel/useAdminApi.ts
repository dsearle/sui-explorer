import { useWallet } from '../../lib/WalletContext'

const BASE = '/api'

export function useAdminApi() {
  const { address } = useWallet()

  async function adminFetch(path: string, options: RequestInit = {}) {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-wallet-address': address ?? '',
        ...(options.headers ?? {}),
      },
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(err.error ?? 'Request failed')
    }
    return res.json()
  }

  return { adminFetch }
}
