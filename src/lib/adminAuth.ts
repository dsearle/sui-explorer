/**
 * Admin auth — wallet-based.
 * Admin wallets are set via env var VITE_ADMIN_WALLETS (comma-separated addresses).
 * Falls back to the hardcoded initial admin address.
 */

const ADMIN_WALLETS_ENV = import.meta.env.VITE_ADMIN_WALLETS ?? ''
const INITIAL_ADMIN = '0xd6d66cc33abce6710fe38936f35099f7a98009e1cde89d118bda0435f48cb1e3'

export const ADMIN_WALLETS: string[] = [
  INITIAL_ADMIN,
  ...ADMIN_WALLETS_ENV.split(',').map((a: string) => a.trim().toLowerCase()).filter(Boolean),
]

export function isAdmin(walletAddress: string | null | undefined): boolean {
  if (!walletAddress) return false
  return ADMIN_WALLETS.includes(walletAddress.toLowerCase())
}
