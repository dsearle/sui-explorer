import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type Node,
  type Edge,
} from '@xyflow/react'
import { ObjectNode } from './NodeCard'
import type { GraphData } from '../lib/graphBuilder'

const nodeTypes = {
  objectNode: ObjectNode,
}

interface Props {
  graphData: GraphData | null
  loading: boolean
  error: string | null
}

const NODE_MINIMAP_COLORS: Record<string, string> = {
  selected: '#6fbcf0',
  owner: '#a78bfa',
  dynamicField: '#34d399',
  transaction: '#fb923c',
  reference: '#94a3b8',
}

export function ObjectGraph({ graphData, loading, error }: Props) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#6fbcf0] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Fetching object data…</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="w-12 h-12 bg-red-900/30 border border-red-500/50 rounded-full flex items-center
            justify-center mx-auto mb-4 text-red-400 text-xl">
            ✕
          </div>
          <h3 className="text-white font-semibold mb-2">Object not found</h3>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  if (!graphData) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-lg px-8">
          {/* Sui-style logo mark */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#161b22] border border-[#30363d]
            flex items-center justify-center">
            <svg viewBox="0 0 50 50" className="w-10 h-10 text-[#6fbcf0]" fill="currentColor">
              <circle cx="25" cy="10" r="5" opacity="0.9" />
              <circle cx="10" cy="30" r="5" opacity="0.7" />
              <circle cx="40" cy="30" r="5" opacity="0.7" />
              <circle cx="17" cy="43" r="4" opacity="0.5" />
              <circle cx="33" cy="43" r="4" opacity="0.5" />
              <line x1="25" y1="15" x2="12" y2="27" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
              <line x1="25" y1="15" x2="38" y2="27" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
              <line x1="12" y1="33" x2="18" y2="40" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
              <line x1="38" y1="33" x2="32" y2="40" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
            </svg>
          </div>

          <h2 className="text-xl font-semibold text-white mb-3">Sui Object Explorer</h2>
          <p className="text-sm text-gray-400 leading-relaxed mb-6">
            Visualize Sui blockchain objects and their relationships.
            Enter an object ID above to explore its owner, dynamic fields,
            transactions, and connected objects.
          </p>

          <div className="grid grid-cols-2 gap-3 text-left">
            {[
              { color: 'bg-[#6fbcf0]', label: 'Selected Object', desc: "The object you're exploring" },
              { color: 'bg-[#a78bfa]', label: 'Owner', desc: 'Wallet or parent object' },
              { color: 'bg-[#34d399]', label: 'Dynamic Fields', desc: 'Child objects attached' },
              { color: 'bg-[#fb923c]', label: 'Transaction', desc: 'Last modifying transaction' },
            ].map(({ color, label, desc }) => (
              <div key={label} className="flex items-start gap-2 bg-[#161b22] rounded-lg p-3
                border border-[#30363d]">
                <span className={`w-2.5 h-2.5 rounded-full mt-0.5 flex-shrink-0 ${color}`} />
                <div>
                  <div className="text-xs font-medium text-white">{label}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1">
      <ReactFlow
        nodes={graphData.nodes as Node[]}
        edges={graphData.edges as Edge[]}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={2}
        attributionPosition="bottom-right"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#21262d" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) => {
            const nodeType = (node.data as { nodeType?: string })?.nodeType ?? 'reference'
            return NODE_MINIMAP_COLORS[nodeType] ?? '#94a3b8'
          }}
          nodeBorderRadius={4}
        />
      </ReactFlow>
    </div>
  )
}
