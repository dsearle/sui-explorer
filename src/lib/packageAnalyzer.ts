import type { SuiMoveNormalizedModule } from '@mysten/sui/jsonRpc'

export interface PackageAnalysis {
  summary: string
  moduleCount: number
  totalFunctions: number
  entryFunctions: number
  totalStructs: number
  categories: string[]
  keyCapabilities: string[]
  complexityScore: 'Simple' | 'Moderate' | 'Complex' | 'Very Complex'
  upgradeability: 'Likely upgradeable' | 'Possibly immutable'
}

// Keyword → capability mapping for heuristic analysis
const CAPABILITY_PATTERNS: [RegExp, string][] = [
  [/deposit|supply|mint/i, 'Asset deposit / minting'],
  [/borrow|loan|debt/i, 'Borrowing / debt management'],
  [/repay|payback/i, 'Loan repayment'],
  [/liquidat/i, 'Liquidation engine'],
  [/swap|exchange|trade/i, 'Token swaps'],
  [/pool|liquidity|lp_/i, 'Liquidity pools'],
  [/stake|staking|unstake/i, 'Staking / delegation'],
  [/vote|governance|proposal/i, 'On-chain governance'],
  [/oracle|price_feed|price_update/i, 'Price oracle integration'],
  [/flash_loan|flashloan/i, 'Flash loans'],
  [/bridge|wormhole|transfer_cross/i, 'Cross-chain bridge'],
  [/nft|kiosk|display|mint_nft/i, 'NFT minting / marketplace'],
  [/order|orderbook|clob|ask|bid/i, 'Order book / CLOB'],
  [/vesting|cliff|unlock/i, 'Token vesting'],
  [/reward|incentive|emission/i, 'Rewards / incentive distribution'],
  [/fee|collect_fee|protocol_fee/i, 'Fee collection'],
  [/upgrade|migrate|admin_cap/i, 'Admin / upgrade controls'],
  [/register|registry/i, 'On-chain registry'],
]

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  DeFi: ['swap', 'pool', 'liquidity', 'amm', 'clmm', 'fee', 'protocol'],
  Lending: ['borrow', 'lend', 'collateral', 'liquidat', 'interest', 'debt', 'supply'],
  Staking: ['stake', 'validator', 'delegation', 'reward', 'epoch', 'cert'],
  NFT: ['nft', 'kiosk', 'display', 'royalty', 'mint', 'collection'],
  Governance: ['vote', 'proposal', 'governance', 'dao', 'quorum'],
  Oracle: ['oracle', 'price_feed', 'pyth', 'switchboard', 'supra'],
  Infrastructure: ['registry', 'upgrade', 'admin', 'config', 'version', 'clock'],
}

function scoreComplexity(
  moduleCount: number,
  totalFunctions: number,
  totalStructs: number
): PackageAnalysis['complexityScore'] {
  const score = moduleCount * 3 + totalFunctions + totalStructs
  if (score < 15) return 'Simple'
  if (score < 50) return 'Moderate'
  if (score < 120) return 'Complex'
  return 'Very Complex'
}

function detectDomains(allNames: string[]): string[] {
  const combined = allNames.join(' ').toLowerCase()
  const matches: string[] = []
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    if (keywords.some((kw) => combined.includes(kw))) {
      matches.push(domain)
    }
  }
  return matches.length > 0 ? matches : ['General Purpose']
}

function detectCapabilities(allNames: string[]): string[] {
  const combined = allNames.join(' ').toLowerCase()
  const found: string[] = []
  for (const [pattern, label] of CAPABILITY_PATTERNS) {
    if (pattern.test(combined) && !found.includes(label)) {
      found.push(label)
    }
  }
  return found.slice(0, 8)
}

function buildSummary(
  modules: Record<string, SuiMoveNormalizedModule>,
  domains: string[],
  capabilities: string[],
  moduleCount: number,
  entryFunctions: number
): string {
  const moduleNames = Object.keys(modules)
  const primaryDomain = domains[0] ?? 'general purpose'
  const domainStr = domains.length > 1 ? domains.slice(0, 2).join(' / ') : primaryDomain

  const capSnippet =
    capabilities.length > 0
      ? `Key capabilities include ${capabilities.slice(0, 3).map((c) => c.toLowerCase()).join(', ')}.`
      : ''

  const moduleSnippet =
    moduleCount === 1
      ? `Single module: ${moduleNames[0]}.`
      : `Spread across ${moduleCount} modules: ${moduleNames.slice(0, 4).join(', ')}${moduleCount > 4 ? ` and ${moduleCount - 4} more` : ''}.`

  const entrySnippet =
    entryFunctions > 0
      ? `Exposes ${entryFunctions} callable entry function${entryFunctions !== 1 ? 's' : ''}.`
      : 'No direct entry functions — designed as a library or base package.'

  return `A ${domainStr.toLowerCase()} package on Sui. ${moduleSnippet} ${capSnippet} ${entrySnippet}`.trim()
}

export function analyzePackage(
  modules: Record<string, SuiMoveNormalizedModule>
): PackageAnalysis {
  const moduleCount = Object.keys(modules).length
  let totalFunctions = 0
  let entryFunctions = 0
  let totalStructs = 0
  const allNames: string[] = []

  for (const [moduleName, mod] of Object.entries(modules)) {
    allNames.push(moduleName)
    const fns = Object.entries(mod.exposedFunctions)
    totalFunctions += fns.length
    entryFunctions += fns.filter(([, fn]) => fn.isEntry).length
    totalStructs += Object.keys(mod.structs).length
    allNames.push(...Object.keys(mod.exposedFunctions))
    allNames.push(...Object.keys(mod.structs))
  }

  const categories = detectDomains(allNames)
  const keyCapabilities = detectCapabilities(allNames)
  const complexityScore = scoreComplexity(moduleCount, totalFunctions, totalStructs)

  // Check for upgrade cap patterns
  const hasUpgradeCap = allNames.some((n) => /upgrade_cap|upgradecap|admin_cap/i.test(n))
  const upgradeability: PackageAnalysis['upgradeability'] = hasUpgradeCap
    ? 'Likely upgradeable'
    : 'Possibly immutable'

  const summary = buildSummary(modules, categories, keyCapabilities, moduleCount, entryFunctions)

  return {
    summary,
    moduleCount,
    totalFunctions,
    entryFunctions,
    totalStructs,
    categories,
    keyCapabilities,
    complexityScore,
    upgradeability,
  }
}
