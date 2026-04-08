import { useState } from 'react'
import { PulseRings } from './PulseRings'
import { QuorumArc } from './QuorumArc'
import { VisualizationCard } from '../VisualizationCard'
import type { Network } from '../../lib/suiClient'

interface FinalityRingsProps {
  network: Network
}

type Variant = 'pulse' | 'quorum'

const FINALITY_DESCRIPTION =
  'Finality on Sui means a transaction is permanently committed and cannot be reversed. ' +
  'Sui uses Mysticeti — a DAG-based consensus protocol that achieves finality in ~3 message rounds, ' +
  'averaging 0.5 seconds. Finality is granted once a quorum (>⅔ of validator stake) has signed ' +
  'the transaction effects certificate.'

const FINALITY_METRICS = [
  { label: 'Pulse — centre value', value: 'Lag between checkpoint timestamp and now (ms)', color: '#6fbcf0' },
  { label: 'Pulse — rings', value: 'Each ring = one recent checkpoint; brightness fades with age', color: '#6fbcf0' },
  { label: 'Pulse — tick marks', value: 'Last 5 checkpoint arrivals around the outer arc', color: '#6fbcf0' },
  { label: 'Quorum — arc sweep', value: 'Simulated quorum build-up from 0% → ⅔ threshold', color: '#6fbcf0' },
  { label: 'Quorum — yellow marker', value: '⅔ stake threshold — finality is guaranteed here', color: '#facc15' },
  { label: 'Quorum — green flash', value: 'Fires each time a checkpoint crosses the quorum threshold', color: '#00e5a0' },
  { label: 'Poll interval', value: 'Every 3 seconds via Sui fullnode RPC', color: '#9ca3af' },
]

export function FinalityRings({ network }: FinalityRingsProps) {
  const [variant, setVariant] = useState<Variant>('pulse')

  const toggle = (
    <div className="flex items-center bg-[#0d1117] border border-[#30363d] rounded-lg p-0.5 gap-0.5">
      <button
        onClick={() => setVariant('pulse')}
        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all
          ${variant === 'pulse' ? 'bg-[#6fbcf0] text-[#0d1117]' : 'text-gray-400 hover:text-white'}`}
      >
        Pulse
      </button>
      <button
        onClick={() => setVariant('quorum')}
        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all
          ${variant === 'quorum' ? 'bg-[#6fbcf0] text-[#0d1117]' : 'text-gray-400 hover:text-white'}`}
      >
        Quorum
      </button>
    </div>
  )

  const resolvedMetrics = [
    ...FINALITY_METRICS,
    { label: 'Network', value: network, color: '#9ca3af' as const },
  ]

  return (
    <VisualizationCard
      title="Finality Rings"
      badge="Live"
      description={FINALITY_DESCRIPTION}
      metrics={resolvedMetrics}
      footer={`Mysticeti consensus · ~0.5s finality · ${network}`}
      controls={toggle}
    >
      <div className="flex-1 flex items-center justify-center h-full min-h-0">
        {variant === 'pulse'
          ? <PulseRings network={network} />
          : <QuorumArc network={network} />
        }
      </div>
    </VisualizationCard>
  )
}
