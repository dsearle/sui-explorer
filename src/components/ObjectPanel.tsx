import type { SuiObjectResponse } from '@mysten/sui/jsonRpc'

interface Props {
  data: SuiObjectResponse | null
  onClose: () => void
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-2 border-b border-[#21262d] last:border-0">
      <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{label}</span>
      <span className="text-xs font-mono text-gray-200 break-all">{value}</span>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const copy = () => navigator.clipboard.writeText(text)
  return (
    <button
      onClick={copy}
      className="text-[10px] px-2 py-0.5 bg-[#21262d] text-gray-400 rounded hover:text-white
        hover:bg-[#30363d] transition-colors ml-2"
    >
      copy
    </button>
  )
}

export function ObjectPanel({ data, onClose }: Props) {
  if (!data?.data) return null

  const obj = data.data
  const content = obj.content

  const ownerStr = obj.owner
    ? typeof obj.owner === 'string'
      ? obj.owner
      : 'AddressOwner' in (obj.owner as object)
        ? `Address: ${(obj.owner as { AddressOwner: string }).AddressOwner}`
        : 'ObjectOwner' in (obj.owner as object)
          ? `Object: ${(obj.owner as { ObjectOwner: string }).ObjectOwner}`
          : 'Shared' in (obj.owner as object)
            ? 'Shared Object'
            : JSON.stringify(obj.owner)
    : 'Unknown'

  return (
    <div className="w-80 h-full bg-[#0d1117] border-l border-[#30363d] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d] bg-[#161b22]">
        <div>
          <h2 className="text-sm font-semibold text-white">Object Details</h2>
          <p className="text-xs text-[#6fbcf0] font-mono mt-0.5">
            {obj.objectId.slice(0, 10)}…{obj.objectId.slice(-6)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400
            hover:text-white hover:bg-[#21262d] transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <Row
          label="Object ID"
          value={
            <span className="flex items-center flex-wrap">
              {obj.objectId}
              <CopyButton text={obj.objectId} />
            </span>
          }
        />
        <Row label="Type" value={obj.type ?? 'N/A'} />
        <Row label="Version" value={obj.version ?? 'N/A'} />
        <Row label="Digest" value={obj.digest ?? 'N/A'} />
        <Row label="Owner" value={ownerStr} />
        {obj.previousTransaction && (
          <Row
            label="Previous Transaction"
            value={
              <span className="flex items-center flex-wrap">
                {obj.previousTransaction}
                <CopyButton text={obj.previousTransaction} />
              </span>
            }
          />
        )}

        {/* Display data (NFT metadata, etc.) */}
        {obj.display?.data && Object.keys(obj.display.data).length > 0 && (
          <div className="mt-3">
            <h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">
              Display Metadata
            </h3>
            {Object.entries(obj.display.data).map(([k, v]) => (
              <Row key={k} label={k} value={String(v)} />
            ))}
          </div>
        )}

        {/* Content fields */}
        {content && 'fields' in content && content.fields && (
          <div className="mt-3">
            <h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">
              Fields
            </h3>
            <div className="bg-[#161b22] rounded-lg p-3 border border-[#30363d]">
              <pre className="text-[10px] text-gray-300 whitespace-pre-wrap break-all leading-relaxed">
                {JSON.stringify(content.fields, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Footer — Sui Explorer link */}
      <div className="px-4 py-3 border-t border-[#30363d] bg-[#161b22]">
        <a
          href={`https://suiexplorer.com/object/${obj.objectId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-[#6fbcf0] hover:text-white transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          View on Sui Explorer
        </a>
      </div>
    </div>
  )
}
