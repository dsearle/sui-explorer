import { useState } from 'react'
import type { SuiTransactionBlockResponse, SuiObjectChange } from '@mysten/sui/jsonRpc'

interface Props {
  data: SuiTransactionBlockResponse | null
  loading: boolean
  error: string | null
  onObjectClick: (id: string) => void
}

type Tab = 'overview' | 'objects' | 'events' | 'raw'

const shortId = (id: string) => `${id.slice(0, 8)}…${id.slice(-6)}`

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${color}`}>
      {children}
    </span>
  )
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button onClick={copy} className="text-[10px] px-1.5 py-0.5 bg-[#21262d] text-gray-400
      rounded hover:text-white transition-colors ml-1">
      {copied ? '✓' : 'copy'}
    </button>
  )
}

function ObjectChangeRow({
  change,
  onObjectClick,
}: {
  change: SuiObjectChange
  onObjectClick: (id: string) => void
}) {
  let objectId = ''
  let label = ''
  let badgeColor = ''

  if ('objectId' in change) {
    objectId = change.objectId
  }

  switch (change.type) {
    case 'created':
      label = 'Created'
      badgeColor = 'bg-green-500/20 text-green-400 border border-green-500/30'
      break
    case 'mutated':
      label = 'Mutated'
      badgeColor = 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
      break
    case 'deleted':
      label = 'Deleted'
      badgeColor = 'bg-red-500/20 text-red-400 border border-red-500/30'
      break
    case 'transferred':
      label = 'Transferred'
      badgeColor = 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
      break
    case 'published':
      label = 'Published'
      badgeColor = 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
      objectId = (change as { packageId: string }).packageId
      break
    case 'wrapped':
      label = 'Wrapped'
      badgeColor = 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
      break
  }

  const typeStr = 'objectType' in change ? String(change.objectType).split('::').slice(-2).join('::') : ''

  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-[#21262d] last:border-0">
      <Badge color={badgeColor}>{label}</Badge>
      <div className="flex-1 min-w-0">
        {typeStr && <div className="text-[10px] text-gray-500 truncate">{typeStr}</div>}
        {objectId && (
          <button
            onClick={() => objectId && onObjectClick(objectId)}
            className="text-xs font-mono text-[#6fbcf0] hover:underline truncate block text-left"
          >
            {shortId(objectId)}
          </button>
        )}
      </div>
      {objectId && <CopyBtn text={objectId} />}
    </div>
  )
}

export function TransactionInspector({ data, loading, error, onObjectClick }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#fb923c] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Fetching transaction…</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="w-12 h-12 bg-red-900/30 border border-red-500/50 rounded-full flex items-center
            justify-center mx-auto mb-4 text-red-400 text-xl">✕</div>
          <h3 className="text-white font-semibold mb-2">Transaction not found</h3>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-lg px-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#161b22] border border-[#30363d]
            flex items-center justify-center text-3xl">🔍</div>
          <h2 className="text-xl font-semibold text-white mb-3">Transaction Inspector</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Enter a transaction digest to inspect execution details — inputs, object changes,
            events, gas costs, and the full execution trace.
          </p>
        </div>
      </div>
    )
  }

  const effects = data.effects
  const tx = data.transaction?.data
  const events = data.events ?? []
  const objectChanges = data.objectChanges ?? []
  const balanceChanges = data.balanceChanges ?? []

  const gasUsed = effects?.gasUsed
  const totalGas = gasUsed
    ? BigInt(gasUsed.computationCost) +
      BigInt(gasUsed.storageCost) -
      BigInt(gasUsed.storageRebate)
    : null

  const status = effects?.status?.status
  const isSuccess = status === 'success'

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'objects', label: 'Object Changes', count: objectChanges.length },
    { id: 'events', label: 'Events', count: events.length },
    { id: 'raw', label: 'Raw' },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#30363d] bg-[#161b22] flex-shrink-0">
        <div className="flex items-center gap-3 mb-1">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full
            ${isSuccess
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
            {isSuccess ? '✓ Success' : '✕ Failed'}
          </span>
          {data.timestampMs && (
            <span className="text-xs text-gray-500">
              {new Date(Number(data.timestampMs)).toLocaleString()}
            </span>
          )}
          {data.checkpoint && (
            <span className="text-xs text-gray-500">Checkpoint {data.checkpoint}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-300 break-all">{data.digest}</span>
          <CopyBtn text={data.digest} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#30363d] flex-shrink-0 px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5
              ${activeTab === tab.id
                ? 'border-[#6fbcf0] text-white'
                : 'border-transparent text-gray-400 hover:text-white'
              }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="bg-[#21262d] text-gray-300 text-[10px] px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
            {/* Gas */}
            {gasUsed && (
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
                <h3 className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">Gas</h3>
                <div className="space-y-2">
                  {[
                    ['Computation', gasUsed.computationCost],
                    ['Storage', gasUsed.storageCost],
                    ['Rebate', `-${gasUsed.storageRebate}`],
                    ['Non-refundable', gasUsed.nonRefundableStorageFee ?? '0'],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between text-xs">
                      <span className="text-gray-400">{label}</span>
                      <span className="text-white font-mono">{Number(val).toLocaleString()} MIST</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-[#30363d] flex justify-between text-xs font-semibold">
                    <span className="text-gray-300">Total</span>
                    <span className="text-[#6fbcf0] font-mono">
                      {totalGas !== null ? Number(totalGas).toLocaleString() : '-'} MIST
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Sender + inputs */}
            {tx && (
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
                <h3 className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">Sender</h3>
                <div className="text-xs font-mono text-[#6fbcf0] break-all">{tx.sender}</div>
                <CopyBtn text={tx.sender} />
              </div>
            )}

            {/* Balance changes */}
            {balanceChanges.length > 0 && (
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 md:col-span-2">
                <h3 className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">
                  Balance Changes
                </h3>
                <div className="space-y-2">
                  {balanceChanges.map((bc, i) => {
                    const amount = BigInt(bc.amount)
                    const isPos = amount >= 0n
                    const coinType = bc.coinType.split('::').pop() ?? bc.coinType
                    const ownerStr = typeof bc.owner === 'object' && 'AddressOwner' in bc.owner
                      ? bc.owner.AddressOwner
                      : JSON.stringify(bc.owner)
                    return (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Badge color={isPos ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                            {coinType}
                          </Badge>
                          <span className="text-gray-400 font-mono">{shortId(ownerStr)}</span>
                        </div>
                        <span className={`font-mono font-semibold ${isPos ? 'text-green-400' : 'text-red-400'}`}>
                          {isPos ? '+' : ''}{Number(amount).toLocaleString()} MIST
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Move calls */}
            {tx?.transaction && 'transactions' in tx.transaction && (
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 md:col-span-2">
                <h3 className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">
                  Move Calls
                </h3>
                <div className="space-y-2">
                  {(tx.transaction as { transactions: unknown[] }).transactions
                    .filter((t): t is { MoveCall: { package: string; module: string; function: string } } =>
                      typeof t === 'object' && t !== null && 'MoveCall' in t
                    )
                    .map((t, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-mono bg-[#0d1117]
                        rounded-lg p-2 border border-[#30363d]">
                        <span className="text-[#a78bfa]">{shortId(t.MoveCall.package)}</span>
                        <span className="text-gray-500">::</span>
                        <span className="text-[#6fbcf0]">{t.MoveCall.module}</span>
                        <span className="text-gray-500">::</span>
                        <span className="text-green-400">{t.MoveCall.function}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* OBJECT CHANGES */}
        {activeTab === 'objects' && (
          <div className="max-w-2xl">
            {objectChanges.length === 0 ? (
              <p className="text-sm text-gray-400">No object changes.</p>
            ) : (
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
                {objectChanges.map((change, i) => (
                  <ObjectChangeRow key={i} change={change} onObjectClick={onObjectClick} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* EVENTS */}
        {activeTab === 'events' && (
          <div className="max-w-3xl space-y-3">
            {events.length === 0 ? (
              <p className="text-sm text-gray-400">No events emitted.</p>
            ) : (
              events.map((event, i) => (
                <div key={i} className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge color="bg-[#fb923c]/20 text-[#fb923c] border border-[#fb923c]/30">
                      Event
                    </Badge>
                    <span className="text-xs text-gray-300 font-mono">
                      {event.type.split('::').slice(-2).join('::')}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono mb-2">{event.type}</div>
                  {event.parsedJson != null && (
                    <pre className="text-[10px] text-gray-300 bg-[#0d1117] rounded-lg p-3
                      border border-[#30363d] overflow-x-auto whitespace-pre-wrap break-all">
                      {JSON.stringify(event.parsedJson as Record<string, unknown>, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* RAW */}
        {activeTab === 'raw' && (
          <div className="max-w-4xl">
            <pre className="text-[10px] text-gray-300 bg-[#161b22] rounded-xl p-4
              border border-[#30363d] overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
