import { useEffect, useState } from 'react'
import { useAdminApi } from './useAdminApi'

interface OwnerRow {
  id: string
  protocol_id: string
  wallet_address: string
  granted_at: string
  protocols: { name: string; emoji: string } | null
}

export function OwnersManager() {
  const { adminFetch } = useAdminApi()
  const [owners, setOwners] = useState<OwnerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [newProtocolId, setNewProtocolId] = useState('')
  const [newWallet, setNewWallet] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try { setOwners(await adminFetch('/admin/owners')) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function addOwner() {
    if (!newProtocolId || !newWallet) return
    setSaving(true)
    try {
      await adminFetch('/admin/owners', {
        method: 'POST',
        body: JSON.stringify({ protocol_id: newProtocolId, wallet_address: newWallet }),
      })
      setNewProtocolId('')
      setNewWallet('')
      load()
    } finally { setSaving(false) }
  }

  async function removeOwner(id: string) {
    await adminFetch('/admin/owners', { method: 'DELETE', body: JSON.stringify({ id }) })
    setOwners(prev => prev.filter(o => o.id !== id))
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h2 className="text-white font-semibold">Protocol Owners</h2>
        <p className="text-gray-500 text-xs mt-0.5">
          Grant wallet addresses the ability to edit specific protocol metadata.
        </p>
      </div>

      {/* Add owner */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 space-y-3">
        <h3 className="text-white text-sm font-medium">Grant Ownership</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Protocol ID</label>
            <input
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2
                text-xs text-gray-200 focus:border-[#6fbcf0] outline-none"
              placeholder="e.g. cetus"
              value={newProtocolId}
              onChange={e => setNewProtocolId(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Wallet Address</label>
            <input
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2
                text-xs text-gray-200 font-mono focus:border-[#6fbcf0] outline-none"
              placeholder="0x..."
              value={newWallet}
              onChange={e => setNewWallet(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={addOwner}
          disabled={saving || !newProtocolId || !newWallet}
          className="px-4 py-2 rounded-lg bg-[#6fbcf0] text-[#0d1117] text-xs font-semibold
            hover:bg-[#5aa8e0] transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : '+ Grant Access'}
        </button>
      </div>

      {/* Owners list */}
      {loading && <p className="text-gray-500 text-sm">Loading…</p>}
      {!loading && owners.length === 0 && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center">
          <p className="text-gray-400 text-sm">No owners assigned yet.</p>
        </div>
      )}
      {owners.length > 0 && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#30363d] text-gray-500 text-[10px] uppercase tracking-wider">
                <th className="text-left px-4 py-3">Protocol</th>
                <th className="text-left px-4 py-3">Wallet</th>
                <th className="text-left px-4 py-3">Granted</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {owners.map(o => (
                <tr key={o.id} className="border-b border-[#21262d] last:border-0">
                  <td className="px-4 py-3 text-white">
                    {o.protocols?.emoji} {o.protocols?.name ?? o.protocol_id}
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-400 text-[10px]">
                    {o.wallet_address.slice(0, 10)}…{o.wallet_address.slice(-6)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(o.granted_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => removeOwner(o.id)}
                      className="text-[10px] px-2 py-1 rounded border border-red-500/20
                        text-red-400 hover:bg-red-500/10 transition-colors">
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
