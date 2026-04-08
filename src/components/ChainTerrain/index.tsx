import { useState } from 'react'
import { useTerrainData } from './useTerrainData'
import { MeshTerrain } from './MeshTerrain'
import { ContourMap } from './ContourMap'
import { HexGrid } from './HexGrid'
import { RippleSurface } from './RippleSurface'
import { VisualizationCard } from '../VisualizationCard'
import type { Network } from '../../lib/suiClient'

type Variant = 'mesh' | 'contour' | 'hex' | 'ripple'

interface ChainTerrainProps {
  network?: Network
}

const VARIANTS: { key: Variant; label: string }[] = [
  { key: 'mesh',    label: '3D Mesh'  },
  { key: 'contour', label: 'Contour'  },
  { key: 'hex',     label: 'Hex Grid' },
  { key: 'ripple',  label: 'Ripple'   },
]

const TERRAIN_DESCRIPTION =
  'Chain Terrain maps the Sui protocol ecosystem as a living landscape. ' +
  'Each peak or node represents a protocol. Height, brightness, and intensity all encode ' +
  'on-chain activity — measured by the mutation count of key state objects (how many times ' +
  'those objects have been modified). Higher mutation counts = more activity = taller/brighter.'

const TERRAIN_METRICS = [
  { label: 'Data source', value: 'Sui mainnet RPC — multiGetObjects on key protocol state objects', color: '#9ca3af' },
  { label: 'Activity metric', value: 'Object version number (= total mutations since creation)', color: '#6fbcf0' },
  { label: '🔥 Hot (red)', value: '1,000,000+ mutations — very high usage', color: '#ef4444' },
  { label: '⚡ Active (amber)', value: '100,000–999,999 mutations', color: '#f59e0b' },
  { label: '📈 Growing (blue)', value: '10,000–99,999 mutations', color: '#6fbcf0' },
  { label: '🌱 Early (green)', value: 'Under 10,000 mutations', color: '#34d399' },
  { label: '3D Mesh — elevation', value: 'Height above baseline = normalised activity score (0–100)', color: '#9ca3af' },
  { label: 'Contour — ring radius', value: 'Max radius scales with activity score; rings pulse outward continuously', color: '#9ca3af' },
  { label: 'Hex Grid — colour intensity', value: 'Fill brightness = activity score; hover a hex for exact metrics', color: '#9ca3af' },
  { label: 'Ripple — wave amplitude', value: 'Peak displacement driven by activity; propagates to neighbours via wave equation', color: '#9ca3af' },
]

export function ChainTerrain({ network = 'mainnet' }: ChainTerrainProps) {
  const [variant, setVariant] = useState<Variant>('contour')
  const { nodes, loading } = useTerrainData(network)

  const toggle = (
    <div className="flex items-center bg-[#0d1117] border border-[#30363d] rounded-lg p-0.5 gap-0.5">
      {VARIANTS.map((v) => (
        <button
          key={v.key}
          onClick={() => setVariant(v.key)}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap
            ${variant === v.key
              ? 'bg-[#6fbcf0] text-[#0d1117]'
              : 'text-gray-400 hover:text-white'
            }`}
        >
          {v.label}
        </button>
      ))}
    </div>
  )

  return (
    <VisualizationCard
      title="Chain Terrain"
      badge="Live"
      description={TERRAIN_DESCRIPTION}
      metrics={TERRAIN_METRICS}
      footer={`Package activity · mutation-weighted · ${network}${loading ? ' · fetching…' : ''}`}
      controls={toggle}
    >
      <div className="w-full h-full min-h-0">
        {variant === 'mesh'    && <MeshTerrain    nodes={nodes} loading={loading} />}
        {variant === 'contour' && <ContourMap     nodes={nodes} loading={loading} />}
        {variant === 'hex'     && <HexGrid        nodes={nodes} loading={loading} />}
        {variant === 'ripple'  && <RippleSurface  nodes={nodes} loading={loading} />}
      </div>
    </VisualizationCard>
  )
}
