import { useEffect, useMemo, useRef, useState } from 'react'
import type { Network } from '../../lib/suiClient'
import { useLiveChain, type LiveBlock } from '../../hooks/useLiveChain'
import { IdLink } from '../IdLink'

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
  const visibleBlocks = useMemo(() => blocks.slice(0, 18), [blocks])
  const [selectedBlock, setSelectedBlock] = useState<LiveBlock | null>(() => visibleBlocks[0] ?? null)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!trackRef.current || visibleBlocks.length === 0) return
    if (trackRef.current.scrollLeft < 24) {
      trackRef.current.scrollTo({ left: 0, behavior: 'smooth' })
    }
  }, [visibleBlocks])

  const explorerBase = 'https://suiexplorer.com'
  const explorerUrl = selectedBlock
    ? `${explorerBase}/checkpoint/${selectedBlock.sequence}?network=${network}`
    : null

  const topTransactions = selectedBlock?.transactions.slice(0, 8) ?? []

  useEffect(() => {
    if (!selectedBlock && visibleBlocks[0]) {
      setSelectedBlock(visibleBlocks[0])
    }
  }, [selectedBlock, visibleBlocks])

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
          <div className="skyline-track pr-4" ref={trackRef}>
            {visibleBlocks.length === 0 && (
              <div className="text-sm text-gray-500">{loading ? 'Syncing chain data…' : error || 'No live blocks yet.'}</div>
            )}
            {visibleBlocks.map((block, idx) => {
              const isActive = selectedBlock?.sequence === block.sequence
              return (
                <div
                  key={block.sequence}
                  className="skyline-card"
                  onClick={() => setSelectedBlock(block)}
                  style={{
                    borderColor: isActive ? meta.accent : `${meta.accent}33`,
                    background: isActive
                      ? `linear-gradient(160deg, ${meta.accent}55, rgba(15,23,42,0.8))`
                      : `linear-gradient(160deg, ${meta.accent}33, rgba(15,23,42,0.6))`,
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
              )
            })}
          </div>
        </div>

        {selectedBlock && (
          <div className="mt-5 bg-[#0b1220] border border-[#1f2937] rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-400 uppercase tracking-[0.3em]">Checkpoint Detail</p>
                <h3 className="text-xl font-semibold text-white">#{selectedBlock.sequence}</h3>
                <p className="text-sm text-gray-400">
                  Finalized {formatTimeAgo(selectedBlock.timestamp)} · {formatTime(selectedBlock.timestamp)} UTC
                </p>
              </div>
              <div className="flex items-center gap-2">
                {explorerUrl && (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#30363d] text-gray-200 hover:text-white"
                  >
                    Open in Sui Explorer ↗
                  </a>
                )}
                <button
                  onClick={() => setSelectedBlock(null)}
                  className="text-gray-500 hover:text-gray-200 text-xs uppercase tracking-wide"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm text-gray-200">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Epoch</p>
                <p className="text-lg font-semibold">{selectedBlock.epoch}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Tx in checkpoint</p>
                <p className="text-lg font-semibold">{formatter.format(selectedBlock.txCount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Network total tx</p>
                <p className="text-lg font-semibold">{formatter.format(selectedBlock.networkTotalTransactions)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Timestamp</p>
                <p className="text-lg font-semibold">{formatTime(selectedBlock.timestamp)}</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-2">Recent transactions</p>
              {topTransactions.length === 0 ? (
                <p className="text-sm text-gray-500">Transactions not available for this checkpoint.</p>
              ) : (
                <div className="max-h-32 overflow-y-auto divide-y divide-[#1f2937]">
                  {topTransactions.map((tx) => (
                    <div key={tx} className="py-1.5 flex items-center justify-between gap-2">
                      <IdLink id={tx} kind="transaction" full />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
