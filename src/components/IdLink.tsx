/**
 * IdLink — a clickable ID that navigates to the correct inspector.
 *
 * Sui heuristics:
 *  - Transaction digest: base58, typically 44 chars, no 0x prefix
 *  - Object / package ID: hex, 0x prefix, 64+ hex chars
 *  - Package IDs look identical to object IDs — caller passes `kind` to disambiguate
 */
import { useState } from 'react'
import { useNavigation } from '../lib/NavigationContext'

export type IdKind = 'object' | 'transaction' | 'package' | 'auto'

interface IdLinkProps {
  id: string
  kind?: IdKind
  /** Show full ID; default is truncated */
  full?: boolean
  className?: string
}

function guessKind(id: string): Exclude<IdKind, 'auto'> {
  if (!id) return 'object'
  // Transaction digests: base58, no 0x, ~44 chars
  if (!id.startsWith('0x') && id.length >= 40) return 'transaction'
  return 'object'
}

function truncate(id: string) {
  if (id.length <= 16) return id
  return `${id.slice(0, 8)}…${id.slice(-6)}`
}

export function IdLink({ id, kind = 'auto', full = false, className = '' }: IdLinkProps) {
  const nav = useNavigation()
  const [copied, setCopied] = useState(false)

  if (!id) return null

  const resolved: Exclude<IdKind, 'auto'> = kind === 'auto' ? guessKind(id) : kind

  const colorClass =
    resolved === 'transaction' ? 'text-[#fb923c] hover:text-orange-300' :
    resolved === 'package'     ? 'text-[#a78bfa] hover:text-purple-300' :
                                 'text-[#6fbcf0] hover:text-blue-300'

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (resolved === 'transaction') nav.openTransaction(id)
    else if (resolved === 'package') nav.openPackage(id)
    else nav.openObject(id)
  }

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const label = full ? id : truncate(id)
  const title = `${resolved === 'transaction' ? 'View transaction' : resolved === 'package' ? 'View package' : 'View object'}: ${id}`

  return (
    <span className={`inline-flex items-center gap-1 font-mono text-xs group ${className}`}>
      <button
        onClick={handleClick}
        title={title}
        className={`${colorClass} hover:underline underline-offset-2 break-all text-left transition-colors`}
      >
        {label}
      </button>
      <button
        onClick={handleCopy}
        title="Copy to clipboard"
        className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] px-1 py-0.5
          bg-[#21262d] text-gray-400 rounded hover:text-white hover:bg-[#30363d]"
      >
        {copied ? '✓' : 'copy'}
      </button>
    </span>
  )
}
