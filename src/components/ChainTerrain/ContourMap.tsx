/**
 * Option B — 2D topographic contour map
 * Protocols as peaks with animated contour rings pulsing outward.
 */
import { useEffect, useRef } from 'react'
import type { TerrainNode } from './useTerrainData'

interface ContourMapProps {
  nodes: TerrainNode[]
  loading: boolean
}

interface Peak {
  node: TerrainNode
  x: number
  y: number
}

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function ContourMap({ nodes, loading }: ContourMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || loading) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const rng = seededRandom(42)

    // Place top nodes as peaks across the canvas
    const topNodes = nodes.slice(0, 12)
    const peaks: Peak[] = topNodes.map((node) => ({
      node,
      x: 40 + rng() * (W - 80),
      y: 30 + rng() * (H - 60),
    }))

    const NUM_CONTOURS = 6
    const CONTOUR_SPEED = 0.0008

    function draw(t: number) {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, W, H)

      // Background
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // Grid lines (map paper feel)
      ctx.strokeStyle = 'rgba(31,41,55,0.6)'
      ctx.lineWidth = 0.5
      const gridSpacing = 30
      for (let x = 0; x < W; x += gridSpacing) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
      }
      for (let y = 0; y < H; y += gridSpacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }

      // Draw contour rings per peak
      peaks.forEach((peak) => {
        const maxR = 80 + peak.node.score * 0.8
        const baseOpacity = 0.15 + peak.node.score / 100 * 0.45

        for (let i = 0; i < NUM_CONTOURS; i++) {
          // Phase offset creates outward-moving rings
          const phase = (t * CONTOUR_SPEED + i / NUM_CONTOURS) % 1
          const r = phase * maxR
          const opacity = baseOpacity * (1 - phase) * (1 - phase)

          // Color based on tier
          let ringColor = '111,188,240'
          if (peak.node.tier === 'hot') ringColor = '239,68,68'
          else if (peak.node.tier === 'active') ringColor = '245,158,11'
          else if (peak.node.tier === 'moderate') ringColor = '111,188,240'
          else if (peak.node.tier === 'low') ringColor = '52,211,153'

          ctx.beginPath()
          ctx.arc(peak.x, peak.y, r, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(${ringColor},${opacity})`
          ctx.lineWidth = 1 + (1 - phase) * 1.5
          ctx.stroke()
        }

        // Peak dot
        const dotR = 3 + peak.node.score / 100 * 5
        const grad = ctx.createRadialGradient(peak.x, peak.y, 0, peak.x, peak.y, dotR * 2)
        grad.addColorStop(0, peak.node.tier === 'hot' ? '#ef4444' :
          peak.node.tier === 'active' ? '#f59e0b' : '#6fbcf0')
        grad.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(peak.x, peak.y, dotR * 2, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()

        ctx.beginPath()
        ctx.arc(peak.x, peak.y, dotR, 0, Math.PI * 2)
        ctx.fillStyle = peak.node.tier === 'hot' ? '#ef4444' :
          peak.node.tier === 'active' ? '#f59e0b' : '#6fbcf0'
        ctx.fill()

        // Label above dot
        ctx.font = `${9 + peak.node.score / 100 * 3}px monospace`
        ctx.fillStyle = 'rgba(200,220,240,0.85)'
        ctx.textAlign = 'center'
        ctx.fillText(`${peak.node.emoji} ${peak.node.name}`, peak.x, peak.y - dotR - 5)
      })

      // Legend
      const tiers = [
        { label: '🔥 Hot (1M+ mutations)', color: '#ef4444' },
        { label: '⚡ Active (100K+)', color: '#f59e0b' },
        { label: '📈 Growing (10K+)', color: '#6fbcf0' },
        { label: '🌱 Early (<10K)', color: '#34d399' },
      ]
      tiers.forEach((t2, i) => {
        ctx.font = '9px monospace'
        ctx.fillStyle = t2.color
        ctx.textAlign = 'left'
        ctx.fillText('●', 8, H - 10 - i * 14)
        ctx.fillStyle = 'rgba(156,163,175,0.7)'
        ctx.fillText(t2.label, 18, H - 10 - i * 14)
      })
    }

    function loop(t: number) {
      draw(t)
      animRef.current = requestAnimationFrame(loop)
    }

    animRef.current = requestAnimationFrame(loop)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [nodes, loading])

  return (
    <div className="w-full h-full flex items-center justify-center">
      {loading ? (
        <span className="text-gray-600 text-xs animate-pulse">Loading terrain data…</span>
      ) : (
        <canvas
          ref={canvasRef}
          width={560}
          height={260}
          className="w-full h-full object-contain"
        />
      )}
    </div>
  )
}
