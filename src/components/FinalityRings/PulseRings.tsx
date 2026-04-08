import { useEffect, useRef, useState } from 'react'
import { getClient } from '../../lib/suiClient'
import type { Network } from '../../lib/suiClient'

interface CheckpointSample {
  sequence: string
  timestampMs: number
  txCount: number
  capturedAt: number
}

interface PulseRingsProps {
  network: Network
}

const MAX_SAMPLES = 8
const POLL_MS = 3000

export function PulseRings({ network }: PulseRingsProps) {
  const [samples, setSamples] = useState<CheckpointSample[]>([])
  const [latencyMs, setLatencyMs] = useState<number | null>(null)
  const [timeSinceLast, setTimeSinceLast] = useState<number>(0)
  const lastSeqRef = useRef<string>('')
  const lastFinalizedAt = useRef<number>(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const animFrameRef = useRef<number | null>(null)

  // Poll checkpoints
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
          const now = Date.now()
          const cpTs = Number(cp.timestampMs ?? now)
          const latency = now - cpTs
          lastSeqRef.current = seq
          lastFinalizedAt.current = now
          setLatencyMs(latency > 0 && latency < 10000 ? latency : null)
          setSamples((prev) => [
            {
              sequence: seq,
              timestampMs: cpTs,
              txCount: cp.transactions?.length ?? 0,
              capturedAt: now,
            },
            ...prev,
          ].slice(0, MAX_SAMPLES))
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
    }
  }, [network])

  // Tick "time since last finality" counter
  useEffect(() => {
    function tick() {
      setTimeSinceLast(Math.floor((Date.now() - lastFinalizedAt.current) / 100) / 10)
      animFrameRef.current = requestAnimationFrame(tick)
    }
    animFrameRef.current = requestAnimationFrame(tick)
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current) }
  }, [])

  const cx = 120
  const cy = 120
  const rings = [28, 50, 72, 94, 116]

  // Each ring pulses based on one of the last N checkpoints
  const ringOpacities = rings.map((_r, i) => {
    const sample = samples[i]
    if (!sample) return 0.06
    const age = Date.now() - sample.capturedAt
    const fade = Math.max(0, 1 - age / (MAX_SAMPLES * POLL_MS))
    return 0.08 + fade * 0.55
  })

  const ringWidths = rings.map((_, i) => {
    const sample = samples[i]
    if (!sample) return 1
    const age = Date.now() - sample.capturedAt
    const fade = Math.max(0, 1 - age / (MAX_SAMPLES * POLL_MS))
    return 1 + fade * 1.5
  })

  return (
    <div className="flex flex-col items-center justify-center h-full w-full select-none py-2">
      <div className="relative">
        <svg width="240" height="240" viewBox="0 0 240 240">
          <defs>
            <radialGradient id="pulseGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6fbcf0" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6fbcf0" stopOpacity="0" />
            </radialGradient>
            {rings.map((_r2, i) => (
              <filter key={i} id={`blur${i}`}>
                <feGaussianBlur stdDeviation={ringOpacities[i] > 0.3 ? '1.5' : '0.5'} />
              </filter>
            ))}
          </defs>

          {/* Background glow */}
          <circle cx={cx} cy={cy} r={60} fill="url(#pulseGlow)" />

          {/* Rings */}
          {rings.map((r, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="#6fbcf0"
              strokeWidth={ringWidths[i]}
              opacity={ringOpacities[i]}
              style={{ transition: 'opacity 0.6s ease, stroke-width 0.6s ease' }}
            />
          ))}

          {/* Centre dot */}
          <circle cx={cx} cy={cy} r={5} fill="#6fbcf0" opacity={0.9} />

          {/* Animated ping on latest checkpoint */}
          {samples.length > 0 && timeSinceLast < 1.5 && (
            <circle
              cx={cx}
              cy={cy}
              r={12}
              fill="none"
              stroke="#6fbcf0"
              strokeWidth="1.5"
              opacity={Math.max(0, 1 - timeSinceLast / 1.5)}
              style={{ transform: `scale(${1 + timeSinceLast * 3})`, transformOrigin: `${cx}px ${cy}px` }}
            />
          )}

          {/* Checkpoint tick marks */}
          {samples.slice(0, 5).map((s, i) => {
            const angle = (i * 72 - 90) * (Math.PI / 180)
            const r2 = 108
            const x1 = cx + (r2 - 4) * Math.cos(angle)
            const y1 = cy + (r2 - 4) * Math.sin(angle)
            const x2 = cx + r2 * Math.cos(angle)
            const y2 = cy + r2 * Math.sin(angle)
            const age = Date.now() - s.capturedAt
            const opacity = Math.max(0, 1 - age / (MAX_SAMPLES * POLL_MS))
            return (
              <line key={s.sequence} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#6fbcf0" strokeWidth="1.5" opacity={opacity * 0.8}
                style={{ transition: 'opacity 0.5s' }}
              />
            )
          })}
        </svg>

        {/* Centre label overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[#6fbcf0] text-lg font-bold font-mono leading-none">
            {latencyMs !== null ? `${latencyMs}ms` : '—'}
          </span>
          <span className="text-gray-500 text-[10px] mt-0.5">finality lag</span>
          <span className="text-gray-600 text-[9px] mt-1 font-mono">
            +{timeSinceLast.toFixed(1)}s ago
          </span>
        </div>
      </div>

      {/* Recent checkpoint strip */}
      <div className="flex gap-1.5 mt-2 flex-wrap justify-center px-2">
        {samples.slice(0, 5).map((s) => (
          <div key={s.sequence}
            className="bg-[#0d1117] border border-[#1f2937] rounded px-2 py-1 text-center"
            style={{ minWidth: 56 }}
          >
            <div className="text-[10px] text-[#6fbcf0] font-mono">#{s.sequence}</div>
            <div className="text-[9px] text-gray-500">{s.txCount} txs</div>
          </div>
        ))}
        {samples.length === 0 && (
          <span className="text-gray-600 text-xs animate-pulse">Listening…</span>
        )}
      </div>
    </div>
  )
}
