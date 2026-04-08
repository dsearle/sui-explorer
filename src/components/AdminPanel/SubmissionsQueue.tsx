import { useEffect, useState } from 'react'
import { useAdminApi } from './useAdminApi'
import type { DbSubmission } from '../../lib/supabase'

export function SubmissionsQueue() {
  const { adminFetch } = useAdminApi()
  const [items, setItems] = useState<DbSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try { setItems(await adminFetch('/admin/submissions?status=pending')) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function act(id: string, action: 'approved' | 'rejected') {
    setActionId(id)
    try {
      await adminFetch('/admin/submissions', { method: 'PATCH', body: JSON.stringify({ id, action }) })
      setItems(prev => prev.filter(i => i.id !== id))
    } finally { setActionId(null) }
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h2 className="text-white font-semibold">Project Submissions</h2>
        <p className="text-gray-500 text-xs mt-0.5">
          Wallet-signed claims and new project submissions from the community.
        </p>
      </div>

      {loading && <p className="text-gray-500 text-sm">Loading…</p>}
      {!loading && items.length === 0 && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center">
          <p className="text-gray-400 text-sm">No pending submissions.</p>
        </div>
      )}

      {items.map(item => {
        const busy = actionId === item.id
        const isClaim = !!item.protocol_id
        return (
          <div key={item.id} className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-semibold">{item.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border
                    ${isClaim
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                    {isClaim ? '🙋 Claim' : '✨ New'}
                  </span>
                </div>
                <p className="text-[10px] font-mono text-gray-500">{item.wallet_address}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button disabled={busy} onClick={() => act(item.id, 'approved')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold
                    bg-green-500/10 text-green-400 border border-green-500/20
                    hover:bg-green-500/20 disabled:opacity-40">
                  ✓ Approve
                </button>
                <button disabled={busy} onClick={() => act(item.id, 'rejected')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold
                    bg-red-500/10 text-red-400 border border-red-500/20
                    hover:bg-red-500/20 disabled:opacity-40">
                  ✕ Reject
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
              {item.tagline && <div><span className="text-gray-600">Tagline: </span><span className="text-gray-300">{item.tagline}</span></div>}
              {item.website && <div><span className="text-gray-600">Website: </span><a href={item.website} target="_blank" rel="noreferrer" className="text-[#6fbcf0] hover:underline">{item.website}</a></div>}
              {item.github  && <div><span className="text-gray-600">GitHub: </span><a href={item.github} target="_blank" rel="noreferrer" className="text-[#6fbcf0] hover:underline">{item.github}</a></div>}
              {item.twitter && <div><span className="text-gray-600">Twitter: </span><a href={item.twitter} target="_blank" rel="noreferrer" className="text-[#6fbcf0] hover:underline">{item.twitter}</a></div>}
              {item.contact_email && <div><span className="text-gray-600">Email: </span><span className="text-gray-300">{item.contact_email}</span></div>}
              {item.category && <div><span className="text-gray-600">Category: </span><span className="text-gray-300">{item.category}</span></div>}
            </div>

            {item.message && (
              <div className="bg-[#0d1117] rounded-lg p-3 border border-[#30363d] text-xs text-gray-400 italic">
                "{item.message}"
              </div>
            )}

            <p className="text-[10px] text-gray-600">
              Submitted {new Date(item.created_at).toLocaleString()}
            </p>
          </div>
        )
      })}
    </div>
  )
}
