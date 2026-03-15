import type { Network } from '../lib/suiClient'

interface Props {
  network: Network
  onChange: (n: Network) => void
}

const NETWORKS: Network[] = ['mainnet', 'testnet', 'devnet']

const DOT_COLORS: Record<Network, string> = {
  mainnet: 'bg-green-400',
  testnet: 'bg-yellow-400',
  devnet: 'bg-blue-400',
}

export function NetworkSelector({ network, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2">
      <span className="text-xs text-gray-400 uppercase tracking-wider mr-1">Network</span>
      {NETWORKS.map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all
            ${network === n
              ? 'bg-[#21262d] text-white border border-[#6fbcf0]'
              : 'text-gray-400 hover:text-white hover:bg-[#21262d]'
            }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[n]}`} />
          {n.charAt(0).toUpperCase() + n.slice(1)}
        </button>
      ))}
    </div>
  )
}
