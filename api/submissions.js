import { supabaseAdmin } from './lib/supabaseAdmin.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const { wallet_address, name, ...rest } = req.body
  if (!wallet_address || !name) return res.status(400).json({ error: 'wallet_address and name are required' })

  const { data, error } = await supabaseAdmin.from('submissions').insert({ wallet_address, name, ...rest }).select().single()
  if (error) return res.status(400).json({ error: error.message })
  return res.status(201).json(data)
}
