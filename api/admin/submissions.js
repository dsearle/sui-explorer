import { supabaseAdmin } from '../lib/supabaseAdmin.js'
import { requireAdmin } from '../lib/authMiddleware.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,PATCH,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-wallet-address')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (!requireAdmin(req, res)) return

  if (req.method === 'GET') {
    const status = req.query.status || 'pending'
    const { data, error } = await supabaseAdmin.from('submissions').select('*').eq('status', status).order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.json(data)
  }

  if (req.method === 'PATCH') {
    const { id, action } = req.body
    if (!id || !action) return res.status(400).json({ error: 'id and action required' })

    if (action === 'approved') {
      const { data: sub, error: subErr } = await supabaseAdmin.from('submissions').select('*').eq('id', id).single()
      if (subErr) return res.status(400).json({ error: subErr.message })

      if (sub.protocol_id) {
        await supabaseAdmin.from('protocol_owners').upsert({ protocol_id: sub.protocol_id, wallet_address: sub.wallet_address }, { onConflict: 'protocol_id,wallet_address' })
      } else {
        const protocolId = sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        await supabaseAdmin.from('protocols').upsert({ id: protocolId, name: sub.name, tagline: sub.tagline || '', description: sub.description || '', category: sub.category || 'DeFi', color: '#6fbcf0', color_to: '#3b82f6', emoji: '🔷', website: sub.website, github: sub.github, twitter: sub.twitter, packages: sub.packages || [], key_objects: [], tags: [], featured: false, status: 'published', source: 'submission' }, { onConflict: 'id' })
        await supabaseAdmin.from('protocol_owners').upsert({ protocol_id: protocolId, wallet_address: sub.wallet_address }, { onConflict: 'protocol_id,wallet_address' })
      }
    }

    const { error } = await supabaseAdmin.from('submissions').update({ status: action, reviewed_at: new Date().toISOString() }).eq('id', id)
    if (error) return res.status(400).json({ error: error.message })
    return res.json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
