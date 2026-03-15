export type ProtocolCategory =
  | 'DeFi'
  | 'Lending'
  | 'DEX'
  | 'NFT'
  | 'Infrastructure'
  | 'Gaming'
  | 'Staking'
  | 'Bridge'

export interface ProtocolPackage {
  id: string
  label: string
  description: string
}

export interface KeyObject {
  id: string
  label: string
  description: string
}

export interface Protocol {
  id: string
  name: string
  tagline: string
  description: string
  category: ProtocolCategory
  color: string        // gradient from
  colorTo: string      // gradient to
  emoji: string
  website: string
  github?: string
  twitter?: string
  packages: ProtocolPackage[]
  keyObjects?: KeyObject[]
  tags: string[]
  featured?: boolean
}

export const PROTOCOLS: Protocol[] = [
  // ─── SUI FRAMEWORK ──────────────────────────────────────────────
  {
    id: 'sui-framework',
    name: 'Sui Framework',
    tagline: 'The core Move framework powering every Sui smart contract',
    description:
      'The foundational package that every Sui Move contract depends on. Contains the object model, coin standard, dynamic fields, transfer primitives, table/bag collections, and core types like Balance, Coin, and TxContext.',
    category: 'Infrastructure',
    color: '#6fbcf0',
    colorTo: '#3b82f6',
    emoji: '🏗️',
    website: 'https://docs.sui.io',
    github: 'https://github.com/MystenLabs/sui',
    packages: [
      { id: '0x2', label: 'sui', description: 'Core Sui framework — objects, coins, transfers, dynamic fields' },
      { id: '0x1', label: 'move-stdlib', description: 'Move standard library — vector, string, option, math' },
      { id: '0x3', label: 'sui-system', description: 'Validator set, staking, epoch management' },
    ],
    keyObjects: [
      { id: '0x5', label: 'SuiSystemState', description: 'Live system state — validators, epoch, staking' },
      { id: '0x6', label: 'Clock', description: 'On-chain clock object for time-based logic' },
    ],
    tags: ['framework', 'core', 'move'],
    featured: true,
  },

  // ─── SCALLOP ────────────────────────────────────────────────────
  {
    id: 'scallop',
    name: 'Scallop',
    tagline: 'Next-generation lending protocol with institutional-grade risk management',
    description:
      'Scallop is Sui\'s leading lending protocol, enabling users to supply assets as collateral and borrow against them. Features isolated risk pools, dynamic interest rate models, liquidation protection, and the SCA governance token. Supports SUI, USDC, USDT, ETH, BTC and more.',
    category: 'Lending',
    color: '#3b82f6',
    colorTo: '#1d4ed8',
    emoji: '🐚',
    website: 'https://scallop.io',
    github: 'https://github.com/scallop-io',
    twitter: 'https://twitter.com/Scallop_io',
    packages: [
      { id: '0xefe8b36d5b2e43728cc323298626b83177803521d195cfb11e15b910e892fddf', label: 'scallop_protocol', description: 'Core lending: deposit, borrow, repay, liquidate' },
      { id: '0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6', label: 'sca_token', description: 'SCA governance token' },
      { id: '0xca5a5a62f01c79a104bf4d31669e29daa387f325c241de4edbe30986a9bc8b0d', label: 'coin_decimals_registry', description: 'On-chain decimal precision registry for supported assets' },
    ],
    keyObjects: [
      { id: '0xa757975255146dc9686aa823b7838b507f315d704f428cbadad2f4ea061939d9', label: 'Market', description: 'Central market state — all lending pools, rates, reserves' },
      { id: '0x07871c4b3c847a0f674510d4978d5cf6f960452795e8ff6f189fd2088a3f6ac7', label: 'Version', description: 'Protocol version object' },
    ],
    tags: ['lending', 'borrowing', 'collateral', 'liquidation', 'defi'],
    featured: true,
  },

  // ─── NAVI PROTOCOL ──────────────────────────────────────────────
  {
    id: 'navi',
    name: 'Navi Protocol',
    tagline: 'Automated liquidity protocol for seamless borrowing and lending',
    description:
      'Navi is a decentralised lending and borrowing protocol on Sui. It offers algorithmic interest rates, flash loans, isolated lending pools, and the NAVX governance token. Integrates with Scallop and Cetus for multi-protocol yield strategies.',
    category: 'Lending',
    color: '#8b5cf6',
    colorTo: '#6d28d9',
    emoji: '🧭',
    website: 'https://naviprotocol.io',
    github: 'https://github.com/naviprotocol',
    twitter: 'https://twitter.com/navi_protocol',
    packages: [
      { id: '0xee0041239b89564ce870a7dec5ddc5d114367ab94a1137e90aa0633cb76518e0', label: 'lending_core', description: 'Core lending logic — supply, borrow, repay, liquidate, flash loans' },
      { id: '0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5', label: 'navx_token', description: 'NAVX governance and incentive token' },
    ],
    tags: ['lending', 'borrowing', 'flash-loans', 'defi', 'navx'],
    featured: true,
  },

  // ─── CETUS ──────────────────────────────────────────────────────
  {
    id: 'cetus',
    name: 'Cetus Protocol',
    tagline: 'Concentrated liquidity DEX and liquidity infrastructure for Sui',
    description:
      'Cetus is the leading concentrated liquidity AMM on Sui, inspired by Uniswap v3. LPs can provide liquidity in custom price ranges for higher capital efficiency. Powers much of Sui DeFi as the base liquidity layer, with deep integrations across the ecosystem.',
    category: 'DEX',
    color: '#06b6d4',
    colorTo: '#0891b2',
    emoji: '🐋',
    website: 'https://cetus.zone',
    github: 'https://github.com/CetusProtocol',
    twitter: 'https://twitter.com/CetusProtocol',
    packages: [
      { id: '0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb', label: 'clmm_pool', description: 'Concentrated liquidity pool — swap, add/remove liquidity, collect fees' },
      { id: '0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b', label: 'cetus_token', description: 'CETUS governance token' },
    ],
    tags: ['dex', 'amm', 'clmm', 'concentrated-liquidity', 'swap'],
    featured: true,
  },

  // ─── DEEPBOOK ───────────────────────────────────────────────────
  {
    id: 'deepbook',
    name: 'DeepBook',
    tagline: 'Sui\'s native central limit order book — shared liquidity layer for all DEXs',
    description:
      'DeepBook is the native CLOB (Central Limit Order Book) built into Sui by Mysten Labs. Any protocol can plug into DeepBook to access deep shared liquidity. Supports limit orders, market orders, and flash loans. The DEEP token governs protocol fees.',
    category: 'Infrastructure',
    color: '#10b981',
    colorTo: '#059669',
    emoji: '📖',
    website: 'https://deepbook.tech',
    github: 'https://github.com/MystenLabs/sui/tree/main/crates/sui-framework/packages/deepbook',
    packages: [
      { id: '0x000000000000000000000000000000000000000000000000000000000000dee9', label: 'deepbook', description: 'v2: pools, orders, matching engine, custodian accounts' },
      { id: '0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270', label: 'deep_token', description: 'DEEP governance token' },
    ],
    tags: ['orderbook', 'clob', 'limit-orders', 'infrastructure', 'shared-liquidity'],
    featured: true,
  },

  // ─── TURBOS ─────────────────────────────────────────────────────
  {
    id: 'turbos',
    name: 'Turbos Finance',
    tagline: 'High-performance concentrated liquidity DEX with advanced order types',
    description:
      'Turbos is a concentrated liquidity DEX built natively on Sui, backed by Jump Crypto. Features tight spreads, efficient routing, and advanced LP management tools including range orders and auto-compounding.',
    category: 'DEX',
    color: '#f59e0b',
    colorTo: '#d97706',
    emoji: '⚡',
    website: 'https://turbos.finance',
    github: 'https://github.com/turbos-finance',
    twitter: 'https://twitter.com/turbos_finance',
    packages: [
      { id: '0x91bfbc386a41afcfd9b2533058d7e915a1d3829089cc268ff4333d54d6339ca1', label: 'turbos_clmm', description: 'CLMM core — pools, swaps, LP positions, fee tiers' },
    ],
    tags: ['dex', 'amm', 'clmm', 'concentrated-liquidity', 'jump-crypto'],
  },

  // ─── AFTERMATH ──────────────────────────────────────────────────
  {
    id: 'aftermath',
    name: 'Aftermath Finance',
    tagline: 'Omnichain DEX aggregator and stablecoin infrastructure',
    description:
      'Aftermath is a DeFi super-app on Sui: a DEX with stable/volatile pool types, yield aggregation, stablecoin (afSUI), and cross-chain bridging. Known for low slippage on stable pairs and native liquid staking.',
    category: 'DeFi',
    color: '#ef4444',
    colorTo: '#dc2626',
    emoji: '🌊',
    website: 'https://aftermath.finance',
    github: 'https://github.com/AftermathFinance',
    twitter: 'https://twitter.com/AftermathFi',
    packages: [
      { id: '0xefe8b36d5b2e43728cc323298626b83177803521d195cfb11e15b910e892fddf', label: 'amm_core', description: 'AMM with stable and volatile pool types, fee collection' },
    ],
    tags: ['dex', 'aggregator', 'stablecoin', 'liquid-staking', 'afsui'],
  },

  // ─── BUCKET PROTOCOL ────────────────────────────────────────────
  {
    id: 'bucket',
    name: 'Bucket Protocol',
    tagline: 'Sui-native stablecoin protocol — mint BUCK against crypto collateral',
    description:
      'Bucket Protocol enables users to mint BUCK, a Sui-native overcollateralised stablecoin, against SUI and other assets. Uses a Trove/CDP model with stability pools and liquidation mechanics similar to Liquity.',
    category: 'DeFi',
    color: '#f97316',
    colorTo: '#ea580c',
    emoji: '🪣',
    website: 'https://bucketprotocol.io',
    github: 'https://github.com/bucket-protocol',
    packages: [
      { id: '0xce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2', label: 'buck_stablecoin', description: 'BUCK token — Sui-native CDP stablecoin' },
    ],
    tags: ['stablecoin', 'cdp', 'collateral', 'buck'],
  },

  // ─── SUINS ──────────────────────────────────────────────────────
  {
    id: 'suins',
    name: 'SuiNS',
    tagline: 'The naming service for Sui — human-readable addresses',
    description:
      'SuiNS maps wallet addresses to human-readable .sui names (e.g. alice.sui). Names are on-chain NFT objects, tradable and composable. The NS token governs the registry. Deeply integrated across wallets, explorers, and DeFi.',
    category: 'Infrastructure',
    color: '#a78bfa',
    colorTo: '#7c3aed',
    emoji: '🏷️',
    website: 'https://suins.io',
    github: 'https://github.com/MystenLabs/suins-contracts',
    packages: [
      { id: '0x22fa05f21b1ad71442491220bb9338f7b7095fe35000ef88d5400d28523bdd93', label: 'suins_core', description: 'Name registry, resolution, registration, renewal logic' },
      { id: '0x5145494a5f5100e645e4b0aa950fa6b68f614e8c59e17bc5ded3495123a79178', label: 'ns_token', description: 'NS governance token' },
    ],
    tags: ['naming-service', 'dns', 'identity', 'nft', 'ns'],
  },

  // ─── BLUEFIN ────────────────────────────────────────────────────
  {
    id: 'bluefin',
    name: 'Bluefin',
    tagline: 'Professional-grade on-chain perpetuals exchange on Sui',
    description:
      'Bluefin is a decentralised perpetuals exchange offering up to 20x leverage on crypto assets. Built natively on Sui for low latency and high throughput. Uses an on-chain orderbook for transparent, non-custodial trading.',
    category: 'DeFi',
    color: '#0ea5e9',
    colorTo: '#0284c7',
    emoji: '🐟',
    website: 'https://bluefin.io',
    github: 'https://github.com/fireflyprotocol',
    packages: [
      { id: '0x830fe26674dc638af7c3d84030e2575f44a2bdc1baa1f4757cfe010a4b106b6a', label: 'bluefin_exchange', description: 'Perpetuals orderbook — orders, positions, margin, liquidation' },
    ],
    tags: ['perpetuals', 'derivatives', 'leverage', 'orderbook'],
  },
]

export function getProtocolById(id: string): Protocol | undefined {
  return PROTOCOLS.find((p) => p.id === id)
}

export function getProtocolByPackage(packageId: string): Protocol | undefined {
  return PROTOCOLS.find((p) => p.packages.some((pkg) => pkg.id === packageId))
}

export const CATEGORIES: ProtocolCategory[] = [
  'DeFi', 'Lending', 'DEX', 'NFT', 'Infrastructure', 'Gaming', 'Staking', 'Bridge',
]
