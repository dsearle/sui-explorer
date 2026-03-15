import { Handle, Position, type NodeProps } from '@xyflow/react'

const NODE_COLORS: Record<string, string> = {
  selected: 'border-[#6fbcf0] bg-[#0d2a40]',
  owner: 'border-[#a78bfa] bg-[#1a1040]',
  dynamicField: 'border-[#34d399] bg-[#0a2a1a]',
  transaction: 'border-[#fb923c] bg-[#2a1500]',
  reference: 'border-[#94a3b8] bg-[#161b22]',
}

const BADGE_COLORS: Record<string, string> = {
  selected: 'bg-[#6fbcf0] text-[#0d1117]',
  owner: 'bg-[#a78bfa] text-[#0d1117]',
  dynamicField: 'bg-[#34d399] text-[#0d1117]',
  transaction: 'bg-[#fb923c] text-[#0d1117]',
  reference: 'bg-[#94a3b8] text-[#0d1117]',
}

export interface ObjectNodeData {
  label: string
  fullId?: string
  nodeType: string
  typeLabel: string
  onClick?: (id: string) => void
  [key: string]: unknown
}

export function ObjectNode({ data }: NodeProps) {
  const d = data as ObjectNodeData
  const colorClass = NODE_COLORS[d.nodeType] ?? NODE_COLORS.reference
  const badgeClass = BADGE_COLORS[d.nodeType] ?? BADGE_COLORS.reference
  const isClickable = !!d.onClick && !!d.fullId

  return (
    <div
      onClick={() => isClickable && d.onClick!(d.fullId!)}
      className={`
        min-w-[120px] max-w-[160px] border-2 rounded-xl p-3 text-center
        transition-all shadow-lg
        ${colorClass}
        ${isClickable ? 'cursor-pointer hover:scale-105 hover:shadow-xl' : 'cursor-default'}
        ${d.nodeType === 'selected' ? 'shadow-[0_0_20px_rgba(111,188,240,0.3)]' : ''}
      `}
    >
      <Handle type="target" position={Position.Top} className="!bg-[#30363d] !border-[#30363d]" />

      {/* Type badge */}
      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 ${badgeClass}`}>
        {d.typeLabel}
      </span>

      {/* Label */}
      <div className="text-xs font-mono text-white leading-tight whitespace-pre-wrap break-all">
        {d.label}
      </div>

      {/* Click hint */}
      {isClickable && d.nodeType !== 'selected' && (
        <div className="text-[9px] text-gray-500 mt-1">click to explore</div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-[#30363d] !border-[#30363d]" />
    </div>
  )
}
