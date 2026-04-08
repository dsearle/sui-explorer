import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://tzbbeleucvwgexfrwyrh.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6YmJlbGV1Y3Z3Z2V4ZnJ3eXJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY0MzY1MiwiZXhwIjoyMDkxMjE5NjUyfQ.Cm6k4xZrKEMaAOwEfs5X-C1J_2KExi62obd3u8d80aY'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// Run SQL statements one at a time via rpc
async function sql(query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })
  return res.json()
}

// Seed protocols from hardcoded data
const PROTOCOLS = [
  {
    id: 'sui-framework', name: 'Sui Framework', tagline: 'The core Move framework powering every Sui smart contract',
    description: 'The foundational package that every Sui Move contract depends on. Contains the object model, coin standard, dynamic fields, transfer primitives, table/bag collections, and core types like Balance, Coin, and TxContext.',
    category: 'Infrastructure', color: '#6fbcf0', color_to: '#3b82f6', emoji: '🏗️',
    website: 'https://docs.sui.io', github: 'https://github.com/MystenLabs/sui',
    packages: [
      { id: '0x2', label: 'sui', description: 'Core Sui framework' },
      { id: '0x1', label: 'move-stdlib', description: 'Move standard library' },
      { id: '0x3', label: 'sui-system', description: 'Validator set, staking, epoch management' },
    ],
    key_objects: [
      { id: '0x5', label: 'SuiSystemState', description: 'Live system state' },
      { id: '0x6', label: 'Clock', description: 'On-chain clock object' },
    ],
    tags: ['framework', 'core', 'move'], featured: true, status: 'published', source: 'manual',
  },
  {
    id: 'scallop', name: 'Scallop', tagline: 'Next-generation lending protocol with institutional-grade risk management',
    description: "Scallop is Sui's leading lending protocol, enabling users to supply assets as collateral and borrow against them.",
    category: 'Lending', color: '#3b82f6', color_to: '#1d4ed8', emoji: '🐚',
    website: 'https://scallop.io', github: 'https://github.com/scallop-io', twitter: 'https://twitter.com/Scallop_io',
    packages: [{ id: '0xefe8b36d5b2e43728cc323298626b83177803521d195cfb11e15b910e892fddf', label: 'scallop_protocol', description: 'Core lending' }],
    key_objects: [{ id: '0xa757975255146dc9686aa823b7838b507f315d704f428cbadad2f4ea061939d9', label: 'Market', description: 'Central market state' }],
    tags: ['lending', 'borrowing', 'defi'], featured: true, status: 'published', source: 'manual',
  },
  {
    id: 'navi', name: 'Navi Protocol', tagline: 'Automated liquidity protocol for seamless borrowing and lending',
    description: 'Navi is a decentralised lending and borrowing protocol on Sui.',
    category: 'Lending', color: '#8b5cf6', color_to: '#6d28d9', emoji: '🧭',
    website: 'https://naviprotocol.io', github: 'https://github.com/naviprotocol', twitter: 'https://twitter.com/navi_protocol',
    packages: [{ id: '0xee0041239b89564ce870a7dec5ddc5d114367ab94a1137e90aa0633cb76518e0', label: 'lending_core', description: 'Core lending logic' }],
    key_objects: [], tags: ['lending', 'flash-loans', 'defi'], featured: true, status: 'published', source: 'manual',
  },
  {
    id: 'cetus', name: 'Cetus Protocol', tagline: 'Concentrated liquidity DEX and liquidity infrastructure for Sui',
    description: 'Cetus is the leading concentrated liquidity AMM on Sui.',
    category: 'DEX', color: '#06b6d4', color_to: '#0891b2', emoji: '🐋',
    website: 'https://cetus.zone', github: 'https://github.com/CetusProtocol', twitter: 'https://twitter.com/CetusProtocol',
    packages: [{ id: '0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb', label: 'clmm_pool', description: 'Concentrated liquidity pool' }],
    key_objects: [], tags: ['dex', 'amm', 'clmm'], featured: true, status: 'published', source: 'manual',
  },
  {
    id: 'deepbook', name: 'DeepBook', tagline: "Sui's native central limit order book",
    description: 'DeepBook is the native CLOB built into Sui by Mysten Labs.',
    category: 'Infrastructure', color: '#10b981', color_to: '#059669', emoji: '📖',
    website: 'https://deepbook.tech', github: 'https://github.com/MystenLabs/sui',
    packages: [{ id: '0x000000000000000000000000000000000000000000000000000000000000dee9', label: 'deepbook', description: 'CLOB core' }],
    key_objects: [], tags: ['orderbook', 'clob', 'infrastructure'], featured: true, status: 'published', source: 'manual',
  },
  {
    id: 'turbos', name: 'Turbos Finance', tagline: 'High-performance concentrated liquidity DEX',
    description: 'Turbos is a concentrated liquidity DEX built natively on Sui, backed by Jump Crypto.',
    category: 'DEX', color: '#f59e0b', color_to: '#d97706', emoji: '⚡',
    website: 'https://turbos.finance', github: 'https://github.com/turbos-finance', twitter: 'https://twitter.com/turbos_finance',
    packages: [{ id: '0x91bfbc386a41afcfd9b2533058d7e915a1d3829089cc268ff4333d54d6339ca1', label: 'turbos_clmm', description: 'CLMM core' }],
    key_objects: [], tags: ['dex', 'amm', 'clmm'], featured: false, status: 'published', source: 'manual',
  },
  {
    id: 'aftermath', name: 'Aftermath Finance', tagline: 'Omnichain DEX aggregator and stablecoin infrastructure',
    description: 'Aftermath is a DeFi super-app on Sui.',
    category: 'DeFi', color: '#ef4444', color_to: '#dc2626', emoji: '🌊',
    website: 'https://aftermath.finance', github: 'https://github.com/AftermathFinance', twitter: 'https://twitter.com/AftermathFi',
    packages: [], key_objects: [], tags: ['dex', 'aggregator', 'stablecoin'], featured: false, status: 'published', source: 'manual',
  },
  {
    id: 'bucket', name: 'Bucket Protocol', tagline: 'Sui-native stablecoin protocol',
    description: 'Bucket Protocol enables users to mint BUCK, a Sui-native overcollateralised stablecoin.',
    category: 'DeFi', color: '#f97316', color_to: '#ea580c', emoji: '🪣',
    website: 'https://bucketprotocol.io', github: 'https://github.com/bucket-protocol',
    packages: [{ id: '0xce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2', label: 'buck_stablecoin', description: 'BUCK token' }],
    key_objects: [], tags: ['stablecoin', 'cdp', 'defi'], featured: false, status: 'published', source: 'manual',
  },
  {
    id: 'suins', name: 'SuiNS', tagline: 'The naming service for Sui',
    description: 'SuiNS maps wallet addresses to human-readable .sui names.',
    category: 'Infrastructure', color: '#a78bfa', color_to: '#7c3aed', emoji: '🏷️',
    website: 'https://suins.io', github: 'https://github.com/MystenLabs/suins-contracts',
    packages: [{ id: '0x22fa05f21b1ad71442491220bb9338f7b7095fe35000ef88d5400d28523bdd93', label: 'suins_core', description: 'Name registry' }],
    key_objects: [], tags: ['naming-service', 'identity', 'nft'], featured: false, status: 'published', source: 'manual',
  },
  {
    id: 'bluefin', name: 'Bluefin', tagline: 'Professional-grade on-chain perpetuals exchange on Sui',
    description: 'Bluefin is a decentralised perpetuals exchange offering up to 20x leverage.',
    category: 'DeFi', color: '#0ea5e9', color_to: '#0284c7', emoji: '🐟',
    website: 'https://bluefin.io', github: 'https://github.com/fireflyprotocol',
    packages: [{ id: '0x830fe26674dc638af7c3d84030e2575f44a2bdc1baa1f4757cfe010a4b106b6a', label: 'bluefin_exchange', description: 'Perpetuals orderbook' }],
    key_objects: [], tags: ['perpetuals', 'derivatives', 'leverage'], featured: false, status: 'published', source: 'manual',
  },
]

async function seed() {
  console.log('Seeding protocols...')
  for (const p of PROTOCOLS) {
    const { error } = await supabase
      .from('protocols')
      .upsert(p, { onConflict: 'id' })
    if (error) {
      console.error(`Failed to seed ${p.id}:`, error.message)
    } else {
      console.log(`✓ ${p.name}`)
    }
  }
  console.log('Done.')
}

seed()
