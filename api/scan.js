import { supabaseAdmin } from './lib/supabaseAdmin.js'

const ADMIN_WALLETS = [
  '0xd6d66cc33abce6710fe38936f35099f7a98009e1cde89d118bda0435f48cb1e3',
  ...(process.env.ADMIN_WALLETS || '').split(',').map(a => a.trim().toLowerCase()).filter(Boolean),
]

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function mapCategory(raw) {
  const r = (raw || '').toLowerCase()
  if (r.includes('dex') || r.includes('exchange')) return 'DEX'
  if (r.includes('lend')) return 'Lending'
  if (r.includes('nft')) return 'NFT'
  if (r.includes('bridge')) return 'Bridge'
  if (r.includes('staking') || r.includes('liquid staking')) return 'Staking'
  if (r.includes('gaming')) return 'Gaming'
  if (r.includes('infra')) return 'Infrastructure'
  return 'DeFi'
}

function emojiForCategory(cat) {
  const map = { DEX: '🔄', Lending: '🏦', NFT: '🎨', Bridge: '🌉', Staking: '🥩', Gaming: '🎮', Infrastructure: '🏗️', DeFi: '💰' }
  return map[mapCategory(cat)] || '🔷'
}

async function fetchDeFiLlama() {
  try {
    const res = await fetch('https://api.llama.fi/protocols')
    const all = await res.json()
    return all
      .filter(p => p.chains?.includes('Sui') || p.chain === 'Sui')
      .map(p => ({
        external_id: p.slug,
        source: 'defilamma',
        suggested: {
          id: slugify(p.name),
          name: p.name,
          tagline: `${p.category} protocol on Sui`,
          category: mapCategory(p.category),
          website: p.url || null,
          twitter: p.twitter ? `https://twitter.com/${p.twitter}` : null,
          color: '#6fbcf0', color_to: '#3b82f6',
          emoji: emojiForCategory(p.category),
          packages: [], key_objects: [],
          tags: [p.category?.toLowerCase()].filter(Boolean),
        },
      }))
  } catch { return [] }
}

async function fetchCoinGecko() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=sui-ecosystem&per_page=100&page=1')
    if (!res.ok) return []
    const coins = await res.json()
    return coins.map(c => ({
      external_id: c.id,
      source: 'coingecko',
      suggested: {
        id: slugify(c.name),
        name: c.name,
        tagline: `${c.symbol.toUpperCase()} — Sui ecosystem token`,
        category: 'DeFi',
        color: '#6fbcf0', color_to: '#3b82f6', emoji: '🪙',
        packages: [], key_objects: [],
        tags: ['token', c.symbol.toLowerCase()],
      },
    }))
  } catch { return [] }
}

export default async function handler(req, res) {
  const isCron = req.headers['x-vercel-cron'] === '1'
  const adminWallet = req.headers['x-wallet-address']
  if (!isCron && (!adminWallet || !ADMIN_WALLETS.includes(adminWallet.toLowerCase()))) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const { data: existing } = await supabaseAdmin.from('protocols').select('id')
  const { data: alreadyScanned } = await supabaseAdmin.from('scan_results').select('external_id')
  const existingIds = new Set((existing || []).map(p => p.id))
  const scannedIds = new Set((alreadyScanned || []).map(s => s.external_id).filter(Boolean))

  const [llamaResults, geckoResults] = await Promise.all([fetchDeFiLlama(), fetchCoinGecko()])
  const all = [...llamaResults, ...geckoResults]

  let queued = 0, duplicates = 0
  for (const item of all) {
    const suggestedId = item.suggested.id || ''
    if (existingIds.has(suggestedId) || scannedIds.has(item.external_id)) { duplicates++; continue }
    await supabaseAdmin.from('scan_results').insert({ source: item.source, external_id: item.external_id, raw_data: {}, suggested: item.suggested, status: 'pending' })
    queued++
  }

  return res.json({ ok: true, queued, duplicates, total: all.length })
}
