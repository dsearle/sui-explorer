import { useState } from 'react'
import type { DirectoryEntry } from '../hooks/useDirectory'

interface Props {
  entry: DirectoryEntry
  onClose: () => void
}

export function ClaimModal({ entry, onClose }: Props) {
  const [name, setName] = useState(entry.name)
  const [description, setDescription] = useState(entry.tagline)
  const [packages, setPackages] = useState('')
  const [website, setWebsite] = useState(entry.website)
  const [twitter, setTwitter] = useState(entry.llama?.twitter ?? '')
  const [github, setGithub] = useState(entry.llama?.github?.[0] ?? '')
  const [submitted, setSubmitted] = useState(false)

  const issueTitle = encodeURIComponent(`[Protocol Claim] ${name}`)
  const issueBody = encodeURIComponent(`## Protocol Claim

**Name:** ${name}
**Website:** ${website}
**Twitter:** ${twitter ? `https://twitter.com/${twitter}` : 'N/A'}
**GitHub:** ${github || 'N/A'}
**DeFiLlama slug:** ${entry.llama?.slug ?? 'N/A'}
**TVL:** ${entry.tvlUsd}
**Category:** ${entry.category}

### Description
${description}

### Move Package IDs (mainnet)
\`\`\`
${packages || '(please add package IDs)'}
\`\`\`

### Key Shared Objects (optional)
<!-- List important shared object IDs and their purpose -->

### Why should this be Official?
<!-- Brief note on why this protocol warrants Official status -->

---
*Submitted via Sui Object Explorer claim flow*`)

  const issueUrl = `https://github.com/dsearle/sui-explorer/issues/new?title=${issueTitle}&body=${issueBody}&labels=protocol-claim`

  const handleClaim = () => {
    window.open(issueUrl, '_blank', 'noopener,noreferrer')
    setSubmitted(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#161b22] border border-[#30363d] rounded-2xl
        shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#30363d]
          bg-[#0d1117]">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="text-lg">{entry.emoji}</span>
              Claim {entry.name}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Become the official maintainer of this protocol's metadata
            </p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400
              hover:text-white hover:bg-[#21262d] transition-colors text-sm">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {submitted ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-white font-semibold mb-2">GitHub issue opened!</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Your claim has been submitted. Once we review and merge the PR,
                <span className="text-[#6fbcf0]"> {entry.name}</span> will be upgraded to
                <span className="text-[#fbbf24]"> 🏅 Official</span> status.
              </p>
              <button onClick={onClose}
                className="mt-4 px-4 py-2 bg-[#6fbcf0] text-[#0d1117] text-sm font-semibold
                  rounded-lg hover:bg-[#5aa8e0] transition-colors">
                Done
              </button>
            </div>
          ) : (
            <>
              {/* DeFiLlama data preview */}
              {entry.llama && (
                <div className="flex items-center gap-3 bg-[#0d1117] rounded-xl p-3
                  border border-[#30363d]">
                  {entry.llama.logo && (
                    <img src={entry.llama.logo} alt="" className="w-8 h-8 rounded-lg object-contain" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white">{entry.name}</div>
                    <div className="text-[10px] text-gray-500">
                      DeFiLlama TVL: <span className="text-[#34d399]">{entry.tvlUsd}</span>
                      {' · '}{entry.category}
                    </div>
                  </div>
                  <span className="text-[10px] bg-[#21262d] text-gray-400 px-2 py-1
                    rounded-full border border-[#30363d]">
                    🔍 Unclaimed
                  </span>
                </div>
              )}

              <p className="text-xs text-gray-400 leading-relaxed">
                Claiming adds this protocol to the official directory with your metadata.
                It opens a pre-filled GitHub issue — we review and merge within 24h.
              </p>

              {/* Form fields */}
              {[
                { label: 'Protocol Name', value: name, onChange: setName },
                { label: 'Website', value: website, onChange: setWebsite },
                { label: 'Twitter (handle only)', value: twitter, onChange: setTwitter },
                { label: 'GitHub (org or repo URL)', value: github, onChange: setGithub },
              ].map(({ label, value, onChange }) => (
                <div key={label}>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-wider
                    font-semibold mb-1">
                    {label}
                  </label>
                  <input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2
                      text-xs text-white focus:outline-none focus:border-[#6fbcf0] transition-colors"
                  />
                </div>
              ))}

              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-wider
                  font-semibold mb-1">
                  Description (one paragraph)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2
                    text-xs text-white focus:outline-none focus:border-[#6fbcf0] transition-colors
                    resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-wider
                  font-semibold mb-1">
                  Mainnet Package IDs (one per line)
                </label>
                <textarea
                  value={packages}
                  onChange={(e) => setPackages(e.target.value)}
                  placeholder="0x..."
                  rows={3}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2
                    text-xs font-mono text-white placeholder-gray-600 focus:outline-none
                    focus:border-[#6fbcf0] transition-colors resize-none"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleClaim}
                className="w-full py-2.5 bg-[#fbbf24] text-[#0d1117] font-bold text-sm rounded-xl
                  hover:bg-[#f59e0b] transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                Open Claim on GitHub
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
