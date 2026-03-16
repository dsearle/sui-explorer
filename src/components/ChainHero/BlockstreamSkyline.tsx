import { useMemo } from 'react'
import type { Network } from '../../lib/suiClient'
import { useLiveChain } from '../../hooks/useLiveChain'

const NETWORK_META: Record<Network, { label: string; accent: string; accentSoft: string }> = {
  mainnet: { label: 'Sui Mainnet', accent: '#6fbcf0', accentSoft: 'rgba(111, 188, 240, 0.2)' },
  testnet: { label: 'Sui Testnet', accent: '#86efac', accentSoft: 'rgba(134, 239, 172, 0.2)' },
  devnet: { label: 'Sui Devnet', accent: '#fbbf24', accentSoft: 'rgba(251, 191, 36, 0.2)' },
}

const formatter = new Intl.NumberFormat('en-US')

function formatTimeAgo(timestamp: number) {
  const diff = Date.now() - timestamp
  if (diff < 5_000) return 'just now'
  if (diff < 60_000) return `${Math.round(diff / 1000)}s ago`
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`
  return `${Math.round(diff / 3_600_000)}h ago`
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

interface Props {
  network: Network
}

export function BlockstreamSkyline({ network }: Props) {
  const meta = NETWORK_META[network]
  const { blocks, loading, error } = useLiveChain(network)
  const visibleBlocks = useMemo(() => blocks.slice(0, 12), [blocks])

  return (
    <section className="blockstream-hero p-6 sm:p-8 mb-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Live Chain</p>
            <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.accent }} />
                {meta.label}
              </span>
              <span className="text-sm text-gray-400">Blockstream Skyline</span>
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-300">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Latest checkpoint</p>
              <p className="font-semibold text-white">#{visibleBlocks[0]?.sequence ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Finalized</p>
              <p className="font-semibold text-white">{visibleBlocks[0] ? formatTimeAgo(visibleBlocks[0].timestamp) : '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Tx in block</p>
              <p className="font-semibold text-white">{visibleBlocks[0] ? formatter.format(visibleBlocks[0].txCount) : '—'}</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="skyline-trail" style={{ background: `linear-gradient(90deg, transparent, ${meta.accentSoft}, transparent)` }} />
          <div className="skyline-track pr-4">
            {visibleBlocks.length === 0 && (
              <div className="text-sm text-gray-500">{loading ? 'Syncing chain data…' : error || 'No live blocks yet.'}</div>
            )}
            {visibleBlocks.map((block, idx) => (
              <div
                key={block.sequence}
                className="skyline-card"
                style={{
                  borderColor: `${meta.accent}33`,
                  background: `linear-gradient(160deg, ${meta.accent}33, rgba(15,23,42,0.6))`,
                  animationDelay: `${idx * 0.3}s`,
                }}
              >
                <p className="text-[0.65rem] uppercase tracking-widest text-gray-400">Checkpoint</p>
                <p className="text-white text-lg font-semibold">#{block.sequence}</p>
                <div className="mt-3 flex flex-col gap-2 text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Finalized</span>
                    <span>{formatTimeAgo(block.timestamp)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Transactions</span>
                    <span>{formatter.format(block.txCount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Timestamp</span>
                    <span>{formatTime(block.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
