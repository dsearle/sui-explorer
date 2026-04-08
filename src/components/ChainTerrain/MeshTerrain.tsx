/**
 * Option A — 3D mesh terrain (CSS 3D perspective transform simulation)
 * No Three.js needed — we fake the 3D with a grid of cells using CSS perspective.
 */
import { useEffect, useRef } from 'react'
import type { TerrainNode } from './useTerrainData'

interface MeshTerrainProps {
  nodes: TerrainNode[]
  loading: boolean
}

const COLS = 14
const ROWS = 8

function buildHeightmap(nodes: TerrainNode[]): number[][] {
  const map: number[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(0))

  // Place nodes at semi-random but deterministic positions
  nodes.forEach((node, i) => {
    const col = (i * 3 + 2) % COLS
    const row = (i * 2 + 1) % ROWS
    const h = node.score / 100
    // Gaussian splat around the peak
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const dist = Math.sqrt((r - row) ** 2 + (c - col) ** 2)
        const spread = 2.5
        map[r][c] = Math.min(1, map[r][c] + h * Math.exp(-(dist ** 2) / (2 * spread ** 2)))
      }
    }
  })

  return map
}

function heightToColor(h: number): string {
  // Deep sea → lowland → highland → peak
  if (h < 0.15) return `rgba(15, 25, 50, ${0.6 + h * 2})`
  if (h < 0.35) return `rgba(30, 60, 100, ${0.7 + h})`
  if (h < 0.55) return `rgba(55, 120, 180, ${0.75 + h * 0.3})`
  if (h < 0.75) return `rgba(111, 188, 240, ${0.8 + h * 0.2})`
  return `rgba(180, 220, 255, ${0.9})`
}

export function MeshTerrain({ nodes, loading }: MeshTerrainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number | null>(null)
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const heightmap = buildHeightmap(nodes)
    const W = canvas.width
    const H = canvas.height

    // Find top nodes for labels
    const topNodes = [...nodes].sort((a, b) => b.score - a.score).slice(0, 5)

    function draw(t: number) {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, W, H)

      // Dark bg
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      // Isometric-style grid drawn back to front
      const cellW = W / COLS
      const cellH = (H * 0.55) / ROWS
      const isoAngle = 0.4
      const baseY = H * 0.82

      for (let r = ROWS - 1; r >= 0; r--) {
        for (let c = 0; c < COLS; c++) {
          const h = heightmap[r][c]
          // Add subtle wave animation to low areas
          const wave = h < 0.3 ? Math.sin(t * 0.001 + r * 0.8 + c * 0.5) * 0.04 : 0
          const finalH = Math.max(0, h + wave)

          const x = c * cellW + (r * cellW * isoAngle * 0.5)
          const y = baseY - r * cellH * 0.5 - finalH * 80

          const w = cellW * 0.92
          const depth = finalH * 80

          // Top face
          ctx.fillStyle = heightToColor(finalH)
          ctx.beginPath()
          ctx.rect(x, y, w, cellH * 0.85)
          ctx.fill()

          // Front face (depth illusion)
          if (depth > 2) {
            const grad = ctx.createLinearGradient(x, y + cellH, x, y + cellH + depth * 0.4)
            grad.addColorStop(0, heightToColor(finalH * 0.6))
            grad.addColorStop(1, 'rgba(5,10,20,0.9)')
            ctx.fillStyle = grad
            ctx.beginPath()
            ctx.rect(x, y + cellH * 0.85, w, depth * 0.4)
            ctx.fill()
          }

          // Glow on hot cells
          if (finalH > 0.7) {
            const glow = ctx.createRadialGradient(x + w / 2, y, 0, x + w / 2, y, w)
            glow.addColorStop(0, `rgba(111,188,240,${0.15 + Math.sin(t * 0.002) * 0.08})`)
            glow.addColorStop(1, 'transparent')
            ctx.fillStyle = glow
            ctx.beginPath()
            ctx.rect(x - w * 0.2, y - 20, w * 1.4, cellH + 20)
            ctx.fill()
          }
        }
      }

      // Labels for top protocols
      topNodes.forEach((node, i) => {
        const col = (i * 3 + 2) % COLS
        const row = (i * 2 + 1) % ROWS
        const h = heightmap[row][col]
        const x = col * cellW + (row * cellW * isoAngle * 0.5) + cellW / 2
        const y = baseY - row * cellH * 0.5 - h * 80 - 12

        ctx.font = 'bold 10px monospace'
        ctx.textAlign = 'center'
        ctx.fillStyle = 'rgba(111,188,240,0.9)'
        ctx.fillText(`${node.emoji} ${node.name}`, x, y)
      })

      // Title overlay
      ctx.font = '10px monospace'
      ctx.textAlign = 'left'
      ctx.fillStyle = 'rgba(111,188,240,0.4)'
      ctx.fillText('PACKAGE ACTIVITY TERRAIN · MAINNET', 12, H - 10)
    }

    function loop(t: number) {
      timeRef.current = t
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
          style={{ imageRendering: 'crisp-edges' }}
        />
      )}
    </div>
  )
}
