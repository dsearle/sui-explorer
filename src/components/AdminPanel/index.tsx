import { useState } from 'react'
import { useWallet } from '../../lib/WalletContext'
import { ScanQueue } from './ScanQueue'
import { SubmissionsQueue } from './SubmissionsQueue'
import { ProtocolManager } from './ProtocolManager'
import { OwnersManager } from './OwnersManager'

type Tab = 'scan' | 'submissions' | 'protocols' | 'owners'

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'scan',        label: 'Scan Queue',    emoji: '🔍' },
  { id: 'submissions', label: 'Submissions',   emoji: '📥' },
  { id: 'protocols',   label: 'Directory',     emoji: '📋' },
  { id: 'owners',      label: 'Owners',        emoji: '🔑' },
]

export function AdminPanel() {
  const { isAdmin, address } = useWallet()
  const [tab, setTab] = useState<Tab>('scan')

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-white text-xl font-semibold mb-2">Admin Access Required</h2>
          <p className="text-gray-400 text-sm">
            Connect your admin wallet to access this panel.
          </p>
          {address && (
            <p className="text-gray-600 text-xs mt-3 font-mono">{address}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0d1117]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#30363d] bg-[#161b22] flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#fbbf24]">Admin</p>
            <h1 className="text-white text-2xl font-semibold">Dashboard</h1>
          </div>
          <div className="text-xs font-mono text-gray-500">{address}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#30363d] px-6 flex-shrink-0 bg-[#0d1117]">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors
              ${tab === t.id
                ? 'border-[#fbbf24] text-white'
                : 'border-transparent text-gray-400 hover:text-white'
              }`}
          >
            <span>{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'scan'        && <ScanQueue />}
        {tab === 'submissions' && <SubmissionsQueue />}
        {tab === 'protocols'   && <ProtocolManager />}
        {tab === 'owners'      && <OwnersManager />}
      </div>
    </div>
  )
}
