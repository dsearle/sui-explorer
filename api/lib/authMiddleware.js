const ADMIN_WALLETS = [
  '0xd6d66cc33abce6710fe38936f35099f7a98009e1cde89d118bda0435f48cb1e3',
  ...(process.env.ADMIN_WALLETS || '').split(',').map(a => a.trim().toLowerCase()).filter(Boolean),
]

export function requireAdmin(req, res) {
  const wallet = req.headers['x-wallet-address']
  if (!wallet || !ADMIN_WALLETS.includes(wallet.toLowerCase())) {
    res.status(403).json({ error: 'Forbidden: admin wallet required' })
    return null
  }
  return wallet
}
