import { useEffect, useRef, useState } from 'react'
import { getClient } from '../../lib/suiClient'
import type { Network } from '../../lib/suiClient'

interface QuorumArcProps {
  network: Network
}

const POLL_MS = 3000
const QUORUM_THRESHOLD = 2 / 3

// Simulate quorum build-up: we don't have per-validator data from public RPC,
// so we animate a fill sweep that resets on each new checkpoint and sweeps to
// the quorum threshold, then flashes on finalisation.
export function QuorumArc({ network }: QuorumArcProps) {
  const [checkpointSeq, setCheckpointSeq] = useState<string | null>(null)
  const [epoch, setEpoch] = useState<string>('—')
  const [txCount, setTxCount] = useState<number>(0)
  const [fill, setFill] = useState(0) // 0–1
  const [flashing, setFlashing] = useState(false)
  const [finalCount, setFinalCount] = useState(0)
  const lastSeqRef = useRef<string>('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sweepRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startSweep = () => {
    if (sweepRef.current) clearInterval(sweepRef.current)
    setFill(0)
    let v = 0
    sweepRef.current = setInterval(() => {
      v += 0.018 + Math.random() * 0.012 // slightly irregular, feels real
      if (v >= QUORUM_THRESHOLD) {
        v = QUORUM_THRESHOLD
        clearInterval(sweepRef.current!)
        sweepRef.current = null
        // hold briefly then flash to 1 and reset
        setTimeout(() => {
          setFill(1)
          setFlashing(true)
          setFinalCount((c) => c + 1)
          setTimeout(() => {
            setFill(0)
            setFlashing(false)
          }, 600)
        }, 180)
      }
      setFill(v)
    }, 40)
  }

  useEffect(() => {
    const client = getClient(network)
    let cancelled = false

    async function poll() {
      try {
        const seq = await client.getLatestCheckpointSequenceNumber()
        if (cancelled) return
        if (seq !== lastSeqRef.current) {
          const cp = await client.getCheckpoint({ id: seq })
          if (!cp || cancelled) return
          lastSeqRef.current = seq
          setCheckpointSeq(seq)
          setEpoch(cp.epoch?.toString() ?? '—')
          setTxCount(cp.transactions?.length ?? 0)
          startSweep()
        }
      } catch (_) { /* silent */ }
      finally {
        if (!cancelled) timerRef.current = setTimeout(poll, POLL_MS)
      }
    }

    poll()
    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
      if (sweepRef.current) clearInterval(sweepRef.current)
    }
  }, [network])

  // SVG arc helpers
  const cx = 110
  const cy = 110
  const R = 88
  const strokeW = 14
  const startAngle = -Math.PI * 0.85
  const endAngle = Math.PI * 0.85
  const totalArc = endAngle - startAngle

  function polarToXY(angle: number, r: number) {
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    }
  }

  function arcPath(from: number, to: number, r: number) {
    const s = polarToXY(from, r)
    const e = polarToXY(to, r)
    const large = to - from > Math.PI ? 1 : 0
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`
  }

  const fillAngle = startAngle + totalArc * Math.min(fill, 1)
  const quorumAngle = startAngle + totalArc * QUORUM_THRESHOLD
  const arcColor = flashing ? '#00e5a0' : fill >= QUORUM_THRESHOLD ? '#00e5a0' : '#6fbcf0'

  return (
    <div className="flex flex-col items-center justify-center h-full w-full select-none py-2">
      <div className="relative">
        <svg width="220" height="220" viewBox="0 0 220 220">
          <defs>
            <filter id="arcGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Track */}
          <path
            d={arcPath(startAngle, endAngle, R)}
            fill="none"
            stroke="#1f2937"
            strokeWidth={strokeW}
            strokeLinecap="round"
          />

          {/* Fill */}
          {fill > 0.01 && (
            <path
              d={arcPath(startAngle, fillAngle, R)}
              fill="none"
              stroke={arcColor}
              strokeWidth={strokeW}
              strokeLinecap="round"
              filter="url(#arcGlow)"
              style={{ transition: 'stroke 0.3s ease' }}
            />
          )}

          {/* 2/3 quorum marker */}
          {(() => {
            const mp = polarToXY(quorumAngle, R)
            const mp2 = polarToXY(quorumAngle, R - strokeW / 2 - 6)
            return (
              <line
                x1={mp.x} y1={mp.y} x2={mp2.x} y2={mp2.y}
                stroke="#facc15" strokeWidth="2" strokeLinecap="round"
              />
            )
          })()}

          {/* Quorum label */}
          {(() => {
            const lp = polarToXY(quorumAngle, R - strokeW / 2 - 16)
            return (
              <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle"
                fontSize="9" fill="#facc15" fontFamily="monospace">
                ⅔
              </text>
            )
          })()}

          {/* Centre info */}
          <text x={cx} y={cy - 14} textAnchor="middle" fontSize="11" fill="#9ca3af" fontFamily="monospace">
            checkpoint
          </text>
          <text x={cx} y={cy + 4} textAnchor="middle" fontSize="18" fill={arcColor}
            fontFamily="monospace" fontWeight="bold"
            style={{ transition: 'fill 0.3s' }}
          >
            #{checkpointSeq ?? '…'}
          </text>
          <text x={cx} y={cy + 22} textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="monospace">
            epoch {epoch}
          </text>
          <text x={cx} y={cy + 38} textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="monospace">
            {txCount} txs
          </text>
        </svg>

        {/* Flash ring on quorum hit */}
        {flashing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-24 h-24 rounded-full border-2 border-[#00e5a0] animate-ping opacity-60" />
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="flex gap-4 mt-1 text-center">
        <div>
          <div className="text-[#00e5a0] text-base font-bold font-mono">{finalCount}</div>
          <div className="text-gray-500 text-[10px]">finalised</div>
        </div>
        <div className="w-px bg-[#1f2937]" />
        <div>
          <div className="text-[#6fbcf0] text-base font-bold font-mono">
            {Math.round(fill * 100)}%
          </div>
          <div className="text-gray-500 text-[10px]">quorum</div>
        </div>
        <div className="w-px bg-[#1f2937]" />
        <div>
          <div className="text-yellow-400 text-base font-bold font-mono">67%</div>
          <div className="text-gray-500 text-[10px]">threshold</div>
        </div>
      </div>
    </div>
  )
}
