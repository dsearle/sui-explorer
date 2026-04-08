import type { SuiObjectResponse } from '@mysten/sui/jsonRpc'
import { IdLink } from './IdLink'
import { useNavigation } from '../lib/NavigationContext'

interface Props {
  data: SuiObjectResponse | null
  onClose: () => void
  onTxClick?: (digest: string) => void
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-2 border-b border-[#21262d] last:border-0">
      <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{label}</span>
      <span className="text-xs font-mono text-gray-200 break-all">{value}</span>
    </div>
  )
}

export function ObjectPanel({ data, onClose }: Props) {
  const nav = useNavigation()

  if (!data?.data) return null

  const obj = data.data
  const content = obj.content

  // Decode owner into display string + optional clickable ID
  let ownerLabel = 'Unknown'
  let ownerClickId: string | null = null
  let ownerKind: 'object' | 'transaction' = 'object'

  if (obj.owner) {
    if (typeof obj.owner === 'string') {
      ownerLabel = obj.owner
    } else if ('AddressOwner' in (obj.owner as object)) {
      const addr = (obj.owner as { AddressOwner: string }).AddressOwner
      ownerLabel = addr
      ownerClickId = addr
      ownerKind = 'object'
    } else if ('ObjectOwner' in (obj.owner as object)) {
      const oid = (obj.owner as { ObjectOwner: string }).ObjectOwner
      ownerLabel = oid
      ownerClickId = oid
      ownerKind = 'object'
    } else if ('Shared' in (obj.owner as object)) {
      ownerLabel = 'Shared Object'
    } else {
      ownerLabel = JSON.stringify(obj.owner)
    }
  }

  return (
    <div className="w-80 h-full bg-[#0d1117] border-l border-[#30363d] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d] bg-[#161b22]">
        <div>
          <h2 className="text-sm font-semibold text-white">Object Details</h2>
          <button
            onClick={() => nav.openObject(obj.objectId)}
            className="text-xs text-[#6fbcf0] font-mono mt-0.5 hover:underline"
          >
            {obj.objectId.slice(0, 10)}…{obj.objectId.slice(-6)}
          </button>
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
          value={<IdLink id={obj.objectId} kind="object" full />}
        />
        <Row label="Type" value={obj.type ?? 'N/A'} />
        <Row label="Version" value={obj.version ?? 'N/A'} />
        <Row label="Digest" value={obj.digest ?? 'N/A'} />
        <Row
          label="Owner"
          value={
            ownerClickId
              ? <IdLink id={ownerClickId} kind={ownerKind} full />
              : ownerLabel
          }
        />
        {obj.previousTransaction && (
          <Row
            label="Previous Transaction"
            value={
              <IdLink id={obj.previousTransaction} kind="transaction" full />
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
            <FieldsRenderer fields={content.fields as Record<string, unknown>} />
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

/**
 * Recursively render fields, making any hex or digest strings clickable.
 */
function FieldsRenderer({ fields }: { fields: Record<string, unknown> }) {
  return (
    <div className="bg-[#161b22] rounded-lg p-3 border border-[#30363d] space-y-1.5">
      {Object.entries(fields).map(([k, v]) => (
        <FieldEntry key={k} label={k} value={v} />
      ))}
    </div>
  )
}

function FieldEntry({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined) return null

  if (typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>
    if ('fields' in obj && typeof obj.fields === 'object') {
      return (
        <div>
          <div className="text-[10px] text-gray-500 mb-1">{label}</div>
          <div className="pl-3 border-l border-[#30363d]">
            <FieldsRenderer fields={obj.fields as Record<string, unknown>} />
          </div>
        </div>
      )
    }
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] text-gray-500">{label}</span>
        <pre className="text-[10px] text-gray-300 whitespace-pre-wrap break-all">
          {JSON.stringify(value, null, 2)}
        </pre>
      </div>
    )
  }

  const str = String(value)
  const isObjectId = str.startsWith('0x') && str.length >= 40
  const isTxDigest = !str.startsWith('0x') && str.length >= 40 && /^[A-Za-z0-9]+$/.test(str)

  return (
    <div className="flex flex-wrap items-start gap-x-2 gap-y-0.5">
      <span className="text-[10px] text-gray-500 shrink-0">{label}:</span>
      {isObjectId || isTxDigest ? (
        <IdLink id={str} kind={isTxDigest ? 'transaction' : 'object'} />
      ) : (
        <span className="text-[10px] text-gray-300 break-all">{str}</span>
      )}
    </div>
  )
}
