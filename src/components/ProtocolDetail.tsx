import { useEffect } from 'react'
import type { Protocol } from '../data/protocols'
import type { PackageAnalysis } from '../lib/packageAnalyzer'
import type { PackageState } from '../hooks/usePackage'

interface Props {
  protocol: Protocol
  packageState: PackageState
  analysis: PackageAnalysis | null
  onBack: () => void
  onExplorePackage: (packageId: string) => void
  onExploreObject: (objectId: string) => void
  onLoadPackage: (packageId: string) => void
}

function StatBadge({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 text-center">
      <div className="text-2xl font-bold text-white mb-0.5" style={{ color }}>{value}</div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{label}</div>
    </div>
  )
}

const COMPLEXITY_COLORS = {
  'Simple': '#34d399',
  'Moderate': '#6fbcf0',
  'Complex': '#f59e0b',
  'Very Complex': '#ef4444',
}

export function ProtocolDetail({
  protocol,
  packageState,
  analysis,
  onBack,
  onExplorePackage,
  onExploreObject,
  onLoadPackage,
}: Props) {
  // Auto-load the first package
  useEffect(() => {
    if (protocol.packages[0]) {
      onLoadPackage(protocol.packages[0].id)
    }
  }, [protocol.id])

  const isLoading = packageState.loading
  const hasAnalysis = !!analysis

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Hero banner */}
      <div className="relative overflow-hidden border-b border-[#30363d]">
        {/* Background glow */}
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at top left, ${protocol.color} 0%, transparent 60%)`,
          }}
        />
        <div className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: `linear-gradient(90deg, ${protocol.color}, ${protocol.colorTo}, transparent)` }}
        />

        <div className="relative px-8 py-8 max-w-5xl mx-auto">
          {/* Back button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Directory
          </button>

          {/* Protocol identity */}
          <div className="flex items-start gap-5 mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${protocol.color}50, ${protocol.colorTo}30)` }}
            >
              {protocol.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-2xl font-bold text-white">{protocol.name}</h1>
                <span className="text-xs px-2.5 py-1 rounded-full border font-semibold"
                  style={{ color: protocol.color, borderColor: `${protocol.color}40`, background: `${protocol.color}10` }}>
                  {protocol.category}
                </span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{protocol.description}</p>

              {/* Links */}
              <div className="flex items-center gap-3 mt-3">
                <a href={protocol.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                  </svg>
                  Website
                </a>
                {protocol.github && (
                  <a href={protocol.github} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                    GitHub
                  </a>
                )}
                {protocol.twitter && (
                  <a href={protocol.twitter} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Twitter
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8 space-y-8">

        {/* AI Analysis panel */}
        {(isLoading || hasAnalysis) && (
          <div className="rounded-2xl border border-[#30363d] bg-[#161b22] overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-[#30363d] bg-[#0d1117]">
              <span className="text-sm">🧠</span>
              <span className="text-xs font-semibold text-white">Package Analysis</span>
              <span className="text-[10px] text-gray-500 ml-auto">
                {isLoading ? 'Analysing…' : `${analysis?.moduleCount} modules loaded`}
              </span>
            </div>

            {isLoading && (
              <div className="px-5 py-6 flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-[#6fbcf0] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <span className="text-sm text-gray-400">Reading on-chain Move modules…</span>
              </div>
            )}

            {hasAnalysis && analysis && (
              <div className="p-5">
                {/* Summary */}
                <p className="text-sm text-gray-200 leading-relaxed mb-5">{analysis.summary}</p>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  <StatBadge label="Modules" value={analysis.moduleCount} color="#6fbcf0" />
                  <StatBadge label="Entry Functions" value={analysis.entryFunctions} color="#34d399" />
                  <StatBadge label="Total Functions" value={analysis.totalFunctions} color="#a78bfa" />
                  <StatBadge label="Structs" value={analysis.totalStructs} color="#fb923c" />
                </div>

                {/* Capabilities + meta */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {analysis.keyCapabilities.length > 0 && (
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">
                        Capabilities
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.keyCapabilities.map((cap) => (
                          <span key={cap} className="text-[10px] px-2 py-1 rounded-lg bg-[#0d1117]
                            border border-[#30363d] text-gray-300">
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Complexity</span>
                      <span className="font-semibold"
                        style={{ color: COMPLEXITY_COLORS[analysis.complexityScore] }}>
                        {analysis.complexityScore}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Upgradeability</span>
                      <span className="text-gray-300 font-medium">{analysis.upgradeability}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Domain</span>
                      <span className="text-gray-300">{analysis.categories.join(', ')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Packages */}
        <div>
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: protocol.color }} />
            Move Packages
          </h2>
          <div className="space-y-2">
            {protocol.packages.map((pkg) => (
              <div key={pkg.id}
                className="group flex items-center gap-4 bg-[#161b22] border border-[#30363d]
                  rounded-xl p-4 hover:border-[#6fbcf0]/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-mono font-semibold text-[#6fbcf0]">{pkg.label}</span>
                  </div>
                  <p className="text-xs text-gray-400">{pkg.description}</p>
                  <p className="text-[10px] font-mono text-gray-600 mt-1 truncate">{pkg.id}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onLoadPackage(pkg.id)}
                    className="text-[10px] px-3 py-1.5 bg-[#21262d] border border-[#30363d]
                      text-gray-400 rounded-lg hover:text-white hover:border-[#6fbcf0]/50 transition-colors"
                  >
                    Analyse
                  </button>
                  <button
                    onClick={() => onExplorePackage(pkg.id)}
                    className="text-[10px] px-3 py-1.5 rounded-lg font-semibold transition-colors text-[#0d1117]"
                    style={{ background: protocol.color }}
                  >
                    View Modules →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key objects */}
        {protocol.keyObjects && protocol.keyObjects.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#34d399]" />
              Key Live Objects
            </h2>
            <div className="space-y-2">
              {protocol.keyObjects.map((obj) => (
                <div key={obj.id}
                  className="group flex items-center gap-4 bg-[#161b22] border border-[#30363d]
                    rounded-xl p-4 hover:border-[#34d399]/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#34d399] mb-0.5">{obj.label}</div>
                    <p className="text-xs text-gray-400">{obj.description}</p>
                    <p className="text-[10px] font-mono text-gray-600 mt-1 truncate">{obj.id}</p>
                  </div>
                  <button
                    onClick={() => onExploreObject(obj.id)}
                    className="text-[10px] px-3 py-1.5 bg-[#34d399]/10 border border-[#34d399]/30
                      text-[#34d399] rounded-lg hover:bg-[#34d399]/20 transition-colors
                      opacity-0 group-hover:opacity-100 flex-shrink-0 font-semibold"
                  >
                    Explore Object →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Tags</div>
          <div className="flex flex-wrap gap-1.5">
            {protocol.tags.map((tag) => (
              <span key={tag} className="text-[10px] px-2.5 py-1 rounded-lg bg-[#161b22]
                border border-[#30363d] text-gray-400 font-mono">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
