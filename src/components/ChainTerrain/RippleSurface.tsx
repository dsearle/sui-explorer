/**
 * Option D — Ripple surface (2.5D)
 * A grid of points where active packages push up like a poked rubber sheet.
 * Ripples propagate to neighbours and decay over time.
 */
import { useEffect, useRef } from 'react'
import type { TerrainNode } from './useTerrainData'

interface RippleSurfaceProps {
  nodes: TerrainNode[]
  loading: boolean
}

const GRID_COLS = 28
const GRID_ROWS = 14
const DECAY = 0.94
const PROPAGATION = 0.18

export function RippleSurface({ nodes, loading }: RippleSurfaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || loading) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height

    // Height field (current) and velocity field
    const height = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(0))
    const vel = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(0))

    // Map top protocols to grid positions
    const topNodes = nodes.slice(0, 16)
    type Source = { row: number; col: number; node: TerrainNode; phase: number }
    const sources: Source[] = topNodes.map((node, i) => ({
      row: 2 + Math.floor(i / 5) * 4 + (i % 2),
      col: 2 + (i % 5) * 5 + Math.floor(i / 5),
      node,
      phase: i * 0.7,
    }))

    let lastT = 0

    function step(t: number) {
      const dt = Math.min(t - lastT, 50)
      lastT = t

      // Drive sources
      sources.forEach((src) => {
        const { row, col, node } = src
        if (row >= GRID_ROWS || col >= GRID_COLS) return
        const baseAmp = node.score / 100
        const freq = 0.001 + baseAmp * 0.0015
        height[row][col] = baseAmp * Math.sin(t * freq + src.phase)
      })

      // Wave propagation (simplified 2D wave equation)
      for (let r = 1; r < GRID_ROWS - 1; r++) {
        for (let c = 1; c < GRID_COLS - 1; c++) {
          // Skip source cells
          if (sources.some((s) => s.row === r && s.col === c)) continue
          const laplacian =
            height[r - 1][c] + height[r + 1][c] +
            height[r][c - 1] + height[r][c + 1] -
            4 * height[r][c]
          vel[r][c] = vel[r][c] * DECAY + laplacian * PROPAGATION * (dt / 16)
          height[r][c] += vel[r][c]
          // Damping
          height[r][c] *= 0.998
        }
      }
    }

    function draw(_t: number) {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      const cellW = W / GRID_COLS
      const cellH = H / GRID_ROWS
      const maxLift = 18

      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          const h = height[r][c]
          const lift = h * maxLift
          const cx2 = c * cellW + cellW / 2
          const cy2 = r * cellH + cellH / 2 - lift

          const absH = Math.abs(h)
          const isHot = absH > 0.6
          const isMid = absH > 0.3

          // Dot
          const dotR = 1.5 + absH * 3
          const alpha = 0.2 + absH * 0.8
          const color = h > 0
            ? (isHot ? `rgba(239,68,68,${alpha})` : isMid ? `rgba(245,158,11,${alpha})` : `rgba(111,188,240,${alpha})`)
            : `rgba(55,120,180,${alpha * 0.4})`

          ctx.beginPath()
          ctx.arc(cx2, cy2, dotR, 0, Math.PI * 2)
          ctx.fillStyle = color
          ctx.fill()

          // Glow for peaks
          if (absH > 0.5) {
            const glow = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, dotR * 4)
            glow.addColorStop(0, isHot ? `rgba(239,68,68,0.3)` : `rgba(111,188,240,0.25)`)
            glow.addColorStop(1, 'transparent')
            ctx.beginPath()
            ctx.arc(cx2, cy2, dotR * 4, 0, Math.PI * 2)
            ctx.fillStyle = glow
            ctx.fill()
          }

          // Connect to right and below neighbours with line
          if (c < GRID_COLS - 1) {
            const h2 = height[r][c + 1]
            const lift2 = h2 * maxLift
            const cx3 = (c + 1) * cellW + cellW / 2
            const cy3 = r * cellH + cellH / 2 - lift2
            const lineAlpha = Math.max(0.04, Math.min(0.25, (absH + Math.abs(h2)) * 0.3))
            ctx.beginPath()
            ctx.moveTo(cx2, cy2)
            ctx.lineTo(cx3, cy3)
            ctx.strokeStyle = `rgba(111,188,240,${lineAlpha})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
          if (r < GRID_ROWS - 1) {
            const h2 = height[r + 1][c]
            const lift2 = h2 * maxLift
            const cx3 = c * cellW + cellW / 2
            const cy3 = (r + 1) * cellH + cellH / 2 - lift2
            const lineAlpha = Math.max(0.04, Math.min(0.25, (absH + Math.abs(h2)) * 0.3))
            ctx.beginPath()
            ctx.moveTo(cx2, cy2)
            ctx.lineTo(cx3, cy3)
            ctx.strokeStyle = `rgba(111,188,240,${lineAlpha})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      // Protocol labels at source points
      sources.forEach((src) => {
        if (src.row >= GRID_ROWS || src.col >= GRID_COLS) return
        const h = height[src.row][src.col]
        const cx2 = src.col * cellW + cellW / 2
        const cy2 = src.row * cellH + cellH / 2 - h * maxLift - 10
        ctx.font = '9px monospace'
        ctx.textAlign = 'center'
        ctx.fillStyle = `rgba(200,220,255,${0.5 + Math.abs(h) * 0.5})`
        ctx.fillText(`${src.node.emoji}${src.node.name.split(' ')[0]}`, cx2, cy2)
      })

      // Scanline overlay for atmosphere
      for (let y = 0; y < H; y += 3) {
        ctx.fillStyle = 'rgba(0,0,0,0.04)'
        ctx.fillRect(0, y, W, 1)
      }
    }

    let lastTime = 0
    function loop(t: number) {
      step(t)
      if (t - lastTime > 16) {
        draw(t)
        lastTime = t
      }
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
          height={250}
          className="w-full h-full object-contain"
        />
      )}
    </div>
  )
}
