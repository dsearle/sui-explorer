import { useEffect, useState } from 'react'
import { useAdminApi } from './useAdminApi'
import type { DbProtocol } from '../../lib/supabase'

export function ProtocolManager() {
  const { adminFetch } = useAdminApi()
  const [protocols, setProtocols] = useState<DbProtocol[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<DbProtocol | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)

  async function load() {
    setLoading(true)
    try { setProtocols(await adminFetch('/admin/protocols')) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function toggleStatus(p: DbProtocol) {
    setActionId(p.id)
    try {
      await adminFetch('/admin/protocols', {
        method: 'PATCH',
        body: JSON.stringify({ id: p.id, status: p.status === 'published' ? 'hidden' : 'published' }),
      })
      setProtocols(prev => prev.map(x => x.id === p.id ? { ...x, status: p.status === 'published' ? 'hidden' : 'published' } : x))
    } finally { setActionId(null) }
  }

  async function seed() {
    setSeeding(true)
    try {
      const res = await adminFetch('/admin/seed', { method: 'POST' })
      alert(`Seeded ${res.seeded} protocols`)
      load()
    } finally { setSeeding(false) }
  }

  async function saveEdit() {
    if (!editing) return
    setActionId(editing.id)
    try {
      await adminFetch('/admin/protocols', { method: 'PATCH', body: JSON.stringify(editing) })
      setProtocols(prev => prev.map(x => x.id === editing.id ? editing : x))
      setEditing(null)
    } finally { setActionId(null) }
  }

  const published = protocols.filter(p => p.status === 'published')
  const hidden = protocols.filter(p => p.status === 'hidden')

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">Protocol Directory</h2>
          <p className="text-gray-500 text-xs mt-0.5">
            {published.length} published · {hidden.length} hidden
          </p>
        </div>
        <button onClick={seed} disabled={seeding}
          className="px-4 py-2 rounded-lg text-xs font-semibold border border-[#30363d]
            text-gray-300 hover:text-white hover:border-[#6fbcf0] disabled:opacity-50">
          {seeding ? '⏳ Seeding…' : '🌱 Seed from hardcoded'}
        </button>
      </div>

      {loading && <p className="text-gray-500 text-sm">Loading…</p>}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-white font-semibold mb-4">Edit: {editing.name}</h3>
            <div className="space-y-3">
              {(['name','tagline','description','category','emoji','website','github','twitter','color','color_to'] as const).map(field => (
                <div key={field}>
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">{field}</label>
                  {field === 'description' ? (
                    <textarea
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2
                        text-xs text-gray-200 resize-none focus:border-[#6fbcf0] outline-none"
                      rows={4}
                      value={String(editing[field] ?? '')}
                      onChange={e => setEditing({ ...editing, [field]: e.target.value })}
                    />
                  ) : (
                    <input
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2
                        text-xs text-gray-200 focus:border-[#6fbcf0] outline-none"
                      value={String(editing[field] ?? '')}
                      onChange={e => setEditing({ ...editing, [field]: e.target.value })}
                    />
                  )}
                </div>
              ))}
              <div className="flex items-center gap-3">
                <input type="checkbox" id="featured" checked={editing.featured}
                  onChange={e => setEditing({ ...editing, featured: e.target.checked })} />
                <label htmlFor="featured" className="text-xs text-gray-300">Featured</label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={saveEdit}
                className="flex-1 py-2 rounded-lg bg-[#6fbcf0] text-[#0d1117] text-xs font-semibold
                  hover:bg-[#5aa8e0] transition-colors">
                Save Changes
              </button>
              <button onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-lg border border-[#30363d] text-gray-400 text-xs hover:text-white">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#30363d] text-gray-500 text-[10px] uppercase tracking-wider">
              <th className="text-left px-4 py-3">Protocol</th>
              <th className="text-left px-4 py-3">Category</th>
              <th className="text-left px-4 py-3">Source</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {protocols.map(p => (
              <tr key={p.id} className="border-b border-[#21262d] last:border-0 hover:bg-[#0d1117]/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span>{p.emoji}</span>
                    <span className="text-white font-medium">{p.name}</span>
                    {p.featured && <span className="text-[9px] text-[#fbbf24]">★</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400">{p.category}</td>
                <td className="px-4 py-3 text-gray-600">{p.source}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border
                    ${p.status === 'published'
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                    }`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(p)}
                      className="text-[10px] px-2 py-1 rounded border border-[#30363d]
                        text-gray-400 hover:text-white hover:border-[#6fbcf0] transition-colors">
                      Edit
                    </button>
                    <button
                      disabled={actionId === p.id}
                      onClick={() => toggleStatus(p)}
                      className={`text-[10px] px-2 py-1 rounded border transition-colors disabled:opacity-40
                        ${p.status === 'published'
                          ? 'border-red-500/20 text-red-400 hover:bg-red-500/10'
                          : 'border-green-500/20 text-green-400 hover:bg-green-500/10'
                        }`}>
                      {p.status === 'published' ? 'Hide' : 'Publish'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
