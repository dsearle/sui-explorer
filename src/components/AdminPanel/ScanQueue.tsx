import { useEffect, useState } from 'react'
import { useAdminApi } from './useAdminApi'
import type { DbScanResult } from '../../lib/supabase'

export function ScanQueue() {
  const { adminFetch } = useAdminApi()
  const [items, setItems] = useState<DbScanResult[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const data = await adminFetch('/admin/scan-results?status=pending')
      setItems(data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function runScan() {
    setScanning(true)
    try {
      const result = await adminFetch('/scan', { method: 'POST' })
      alert(`Scan complete: ${result.queued} new, ${result.duplicates} duplicates`)
      load()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Scan failed')
    } finally { setScanning(false) }
  }

  async function act(id: string, action: 'approve' | 'rejected' | 'duplicate') {
    setActionId(id)
    try {
      await adminFetch('/admin/scan-results', {
        method: 'PATCH',
        body: JSON.stringify({ id, action }),
      })
      setItems(prev => prev.filter(i => i.id !== id))
    } finally { setActionId(null) }
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">Auto-Discovery Queue</h2>
          <p className="text-gray-500 text-xs mt-0.5">
            Protocols found by scanning DeFiLlama and CoinGecko. Publish or hide each one.
          </p>
        </div>
        <button
          onClick={runScan}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#6fbcf0]/10
            border border-[#6fbcf0]/30 text-[#6fbcf0] text-xs font-semibold
            hover:bg-[#6fbcf0]/20 transition-colors disabled:opacity-50"
        >
          {scanning ? '⏳ Scanning…' : '🔍 Run Scan Now'}
        </button>
      </div>

      {loading && <p className="text-gray-500 text-sm">Loading…</p>}
      {!loading && items.length === 0 && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center">
          <p className="text-gray-400 text-sm">No pending items. Run a scan to discover new protocols.</p>
        </div>
      )}

      {items.map(item => {
        const s = item.suggested as Record<string, string>
        const busy = actionId === item.id
        return (
          <div key={item.id} className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{`${s.emoji ?? '🔷'}`}</span>
                  <span className="text-white font-semibold">{`${s.name ?? '—'}`}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6fbcf0]/10
                    text-[#6fbcf0] border border-[#6fbcf0]/20">
                    {item.source}
                  </span>
                </div>
                <p className="text-gray-400 text-xs mb-2">{String(s.tagline ?? '')}</p>
                <div className="flex gap-3 text-[10px] text-gray-600 flex-wrap">
                  <span>Category: {String(s.category ?? '—')}</span>
                  {s.website && <a href={String(s.website)} target="_blank" rel="noreferrer"
                    className="text-[#6fbcf0] hover:underline">{String(s.website)}</a>}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button disabled={busy} onClick={() => act(item.id, 'approve')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold
                    bg-green-500/10 text-green-400 border border-green-500/20
                    hover:bg-green-500/20 transition-colors disabled:opacity-40">
                  ✓ Publish
                </button>
                <button disabled={busy} onClick={() => act(item.id, 'duplicate')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold
                    bg-yellow-500/10 text-yellow-400 border border-yellow-500/20
                    hover:bg-yellow-500/20 transition-colors disabled:opacity-40">
                  Duplicate
                </button>
                <button disabled={busy} onClick={() => act(item.id, 'rejected')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold
                    bg-red-500/10 text-red-400 border border-red-500/20
                    hover:bg-red-500/20 transition-colors disabled:opacity-40">
                  ✕ Hide
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
