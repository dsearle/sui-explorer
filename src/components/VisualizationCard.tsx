/**
 * VisualizationCard — reusable wrapper that adds:
 *  - Fullscreen expand / collapse (fills viewport, Escape to close)
 *  - Description panel in dashboard view (collapsible)
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface DescriptionItem {
  label: string
  value: string
  color?: string
}

interface VisualizationCardProps {
  title: string
  badge?: string          // e.g. "Live"
  badgeColor?: string
  description: string
  metrics: DescriptionItem[]
  children: ReactNode
  footer?: string
  controls?: ReactNode    // variant toggle or other controls
}

export function VisualizationCard({
  title,
  badge,
  badgeColor = '#6fbcf0',
  description,
  metrics,
  children,
  footer,
  controls,
}: VisualizationCardProps) {
  const [fullscreen, setFullscreen] = useState(false)
  const [descOpen, setDescOpen] = useState(false)
  const escRef = useRef<((e: KeyboardEvent) => void) | null>(null)

  useEffect(() => {
    if (fullscreen) {
      escRef.current = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setFullscreen(false)
      }
      window.addEventListener('keydown', escRef.current)
      return () => {
        if (escRef.current) window.removeEventListener('keydown', escRef.current)
      }
    }
  }, [fullscreen])

  const header = (
    <div className="flex items-center justify-between mb-3 flex-shrink-0 gap-3 flex-wrap">
      <div className="flex-shrink-0">
        {badge && (
          <p className="text-xs uppercase tracking-[0.3em]" style={{ color: badgeColor }}>{badge}</p>
        )}
        <h3 className="text-white text-xl font-semibold mt-0.5">{title}</h3>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {controls && <div className="flex-shrink-0">{controls}</div>}
        {/* Info toggle (dashboard only) */}
        {!fullscreen && (
          <button
            onClick={() => setDescOpen((v) => !v)}
            title={descOpen ? 'Hide description' : 'Show description'}
            className={`p-1.5 rounded-lg border transition-colors text-xs
              ${descOpen
                ? 'border-[#6fbcf0] text-[#6fbcf0] bg-[#6fbcf0]/10'
                : 'border-[#30363d] text-gray-500 hover:text-gray-300 hover:border-[#6fbcf0]'
              }`}
          >
            <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        {/* Fullscreen toggle */}
        <button
          onClick={() => setFullscreen((v) => !v)}
          title={fullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
          className="p-1.5 rounded-lg border border-[#30363d] text-gray-500
            hover:text-gray-300 hover:border-[#6fbcf0] transition-colors"
        >
          {fullscreen ? (
            <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="currentColor">
              <path fillRule="evenodd" d="M5 4a1 1 0 00-1 1v3a1 1 0 01-2 0V5a3 3 0 013-3h3a1 1 0 010 2H5zm10 0h-3a1 1 0 010-2h3a3 3 0 013 3v3a1 1 0 01-2 0V5a1 1 0 00-1-1zM4 11a1 1 0 011 1v3a1 1 0 001 1h3a1 1 0 010 2H6a3 3 0 01-3-3v-3a1 1 0 011-1zm12 0a1 1 0 011 1v3a3 3 0 01-3 3h-3a1 1 0 010-2h3a1 1 0 001-1v-3a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="currentColor">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H5.414l3.293 3.293a1 1 0 01-1.414 1.414L4 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V5.414l-3.293 3.293a1 1 0 01-1.414-1.414L13.586 4H12zm-9 7a1 1 0 012 0v1.586l3.293-3.293a1 1 0 011.414 1.414L6.414 14H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-3.293-3.293a1 1 0 011.414-1.414L16 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )

  const descPanel = !fullscreen && descOpen && (
    <div className="mb-3 bg-[#0d1117] border border-[#1f2937] rounded-xl p-4 flex-shrink-0">
      <p className="text-sm text-gray-400 leading-relaxed mb-3">{description}</p>
      <div className="grid grid-cols-2 gap-2">
        {metrics.map((m, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wider text-gray-600">{m.label}</span>
            <span className="text-xs" style={{ color: m.color ?? '#9ca3af' }}>{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  )

  const footerEl = footer && (
    <p className="text-xs text-gray-600 mt-2 text-center flex-shrink-0">{footer}</p>
  )

  // Dashboard card
  if (!fullscreen) {
    return (
      <div className="bg-[#0b1220] border border-[#1f2937] rounded-2xl p-5 flex flex-col h-full">
        {header}
        {descPanel}
        <div className="flex-1 min-h-0 overflow-hidden">
          {children}
        </div>
        {footerEl}
      </div>
    )
  }

  // Fullscreen portal
  return (
    <>
      {/* Placeholder to preserve layout */}
      <div className="bg-[#0b1220] border border-[#1f2937] rounded-2xl p-5 flex flex-col h-full opacity-30 pointer-events-none">
        {header}
        <div className="flex-1 flex items-center justify-center text-gray-700 text-sm">
          Viewing fullscreen…
        </div>
      </div>

      {createPortal(
        <div
          className="fixed inset-0 z-50 flex flex-col bg-[#0b1220]"
          style={{ animation: 'fadeIn 0.15s ease' }}
        >
          {/* Fullscreen header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f2937] flex-shrink-0 gap-4 flex-wrap">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                {badge && (
                  <p className="text-xs uppercase tracking-[0.3em]" style={{ color: badgeColor }}>{badge}</p>
                )}
                <h2 className="text-white text-2xl font-semibold mt-0.5">{title}</h2>
              </div>
              {controls && <div>{controls}</div>}
            </div>
            <button
              onClick={() => setFullscreen(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#30363d]
                text-sm text-gray-400 hover:text-white hover:border-[#6fbcf0] transition-colors flex-shrink-0"
            >
              <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
                <path fillRule="evenodd" d="M5 4a1 1 0 00-1 1v3a1 1 0 01-2 0V5a3 3 0 013-3h3a1 1 0 010 2H5zm10 0h-3a1 1 0 010-2h3a3 3 0 013 3v3a1 1 0 01-2 0V5a1 1 0 00-1-1zM4 11a1 1 0 011 1v3a1 1 0 001 1h3a1 1 0 010 2H6a3 3 0 01-3-3v-3a1 1 0 011-1zm12 0a1 1 0 011 1v3a3 3 0 01-3 3h-3a1 1 0 010-2h3a1 1 0 001-1v-3a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Exit fullscreen
              <span className="text-gray-600 text-xs ml-1">Esc</span>
            </button>
          </div>

          {/* Fullscreen viz */}
          <div className="flex-1 min-h-0 overflow-hidden p-4">
            {children}
          </div>

          {/* Fullscreen footer with metrics */}
          <div className="border-t border-[#1f2937] px-6 py-3 flex-shrink-0 bg-[#0b1220]">
            <p className="text-xs text-gray-500 mb-2">{description}</p>
            <div className="flex gap-6 flex-wrap">
              {metrics.map((m, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-[10px] uppercase tracking-wider text-gray-600">{m.label}:</span>
                  <span className="text-xs font-mono" style={{ color: m.color ?? '#9ca3af' }}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
