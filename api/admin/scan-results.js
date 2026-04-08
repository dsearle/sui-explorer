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
    const { data, error } = await supabaseAdmin.from('scan_results').select('*').eq('status', status).order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.json(data)
  }

  if (req.method === 'PATCH') {
    const { id, action } = req.body
    if (!id || !action) return res.status(400).json({ error: 'id and action required' })

    if (action === 'approve') {
      const { data: scan, error: scanErr } = await supabaseAdmin.from('scan_results').select('*').eq('id', id).single()
      if (scanErr) return res.status(400).json({ error: scanErr.message })

      const suggested = scan.suggested || {}
      const protocolId = suggested.id || (suggested.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-') || id

      await supabaseAdmin.from('protocols').upsert({
        id: protocolId,
        name: suggested.name || 'Unknown',
        tagline: suggested.tagline || '',
        description: suggested.description || '',
        category: suggested.category || 'DeFi',
        color: suggested.color || '#6fbcf0',
        color_to: suggested.color_to || '#3b82f6',
        emoji: suggested.emoji || '🔷',
        website: suggested.website || null,
        github: suggested.github || null,
        twitter: suggested.twitter || null,
        packages: suggested.packages || [],
        key_objects: suggested.key_objects || [],
        tags: suggested.tags || [],
        featured: false,
        status: 'published',
        source: scan.source,
      }, { onConflict: 'id' })
    }

    const finalStatus = action === 'approve' ? 'approved' : action
    const { error } = await supabaseAdmin.from('scan_results').update({ status: finalStatus, reviewed_at: new Date().toISOString() }).eq('id', id)
    if (error) return res.status(400).json({ error: error.message })
    return res.json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
