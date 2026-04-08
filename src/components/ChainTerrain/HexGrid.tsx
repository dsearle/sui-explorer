/**
 * Option C — Hex grid heatmap
 * Protocols laid out in a hex grid, colour + subtle elevation = activity level.
 */
import { useEffect, useRef, useState } from 'react'
import type { TerrainNode } from './useTerrainData'

interface HexGridProps {
  nodes: TerrainNode[]
  loading: boolean
}

interface HexCell {
  node: TerrainNode
  cx: number
  cy: number
}

function hexCorners(cx: number, cy: number, r: number): [number, number][] {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]
  }) as [number, number][]
}

export function HexGrid({ nodes, loading }: HexGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number | null>(null)
  const [hovered, setHovered] = useState<TerrainNode | null>(null)
  const cellsRef = useRef<HexCell[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || loading) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height

    const R = 36
    const colW = R * Math.sqrt(3)
    const rowH = R * 1.5

    // Layout hex grid
    const maxCols = Math.floor(W / colW)
    const cells: HexCell[] = []

    const topNodes = nodes.slice(0, 18)
    topNodes.forEach((node, i) => {
      const col = i % maxCols
      const row = Math.floor(i / maxCols)
      const offsetX = row % 2 === 0 ? 0 : colW / 2
      const cx = 40 + col * colW + offsetX
      const cy = 40 + row * rowH
      cells.push({ node, cx, cy })
    })

    cellsRef.current = cells

    function draw(t: number) {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, W, H)

      cells.forEach((cell) => {
        const { node, cx, cy } = cell
        const corners = hexCorners(cx, cy, R - 2)
        const h = node.score / 100

        // Pulse on hot nodes
        const pulse = node.tier === 'hot'
          ? Math.sin(t * 0.003) * 0.08
          : node.tier === 'active'
          ? Math.sin(t * 0.002 + cx) * 0.04
          : 0

        // Fill color based on tier + score
        const alpha = 0.15 + h * 0.55 + pulse
        let fillRGB = '111,188,240'
        if (node.tier === 'hot') fillRGB = '239,68,68'
        else if (node.tier === 'active') fillRGB = '245,158,11'
        else if (node.tier === 'low') fillRGB = '52,211,153'
        else if (node.tier === 'unknown') fillRGB = '55,65,81'

        // Hex body
        ctx.beginPath()
        corners.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y))
        ctx.closePath()

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R)
        grad.addColorStop(0, `rgba(${fillRGB},${alpha})`)
        grad.addColorStop(1, `rgba(${fillRGB},${alpha * 0.3})`)
        ctx.fillStyle = grad
        ctx.fill()

        // Border
        const borderAlpha = 0.2 + h * 0.5
        ctx.strokeStyle = `rgba(${fillRGB},${borderAlpha})`
        ctx.lineWidth = node === hovered ? 2.5 : 1
        ctx.stroke()

        // Inner highlight on top edge
        if (h > 0.3) {
          const [x0, y0] = corners[5]
          const [x1, y1] = corners[0]
          const [x2, y2] = corners[1]
          ctx.beginPath()
          ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2)
          ctx.strokeStyle = `rgba(255,255,255,${h * 0.15})`
          ctx.lineWidth = 1
          ctx.stroke()
        }

        // Emoji + name
        ctx.font = '14px serif'
        ctx.textAlign = 'center'
        ctx.fillStyle = `rgba(255,255,255,${0.7 + h * 0.3})`
        ctx.fillText(node.emoji, cx, cy - 6)

        ctx.font = `bold ${7 + h * 3}px monospace`
        ctx.fillStyle = `rgba(200,220,240,${0.6 + h * 0.4})`
        ctx.fillText(node.name.split(' ')[0], cx, cy + 10)

        // Score bar at bottom of hex
        if (node.score > 0) {
          ctx.font = '8px monospace'
          ctx.fillStyle = `rgba(${fillRGB},0.8)`
          ctx.fillText(`${node.score}`, cx, cy + 22)
        }
      })
    }

    function loop(t: number) {
      draw(t)
      animRef.current = requestAnimationFrame(loop)
    }

    animRef.current = requestAnimationFrame(loop)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [nodes, loading, hovered])

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top) * scaleY
    const R = 36

    const hit = cellsRef.current.find((c) => {
      const dx = mx - c.cx
      const dy = my - c.cy
      return Math.sqrt(dx * dx + dy * dy) < R
    })
    setHovered(hit?.node ?? null)
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      {loading ? (
        <span className="text-gray-600 text-xs animate-pulse">Loading terrain data…</span>
      ) : (
        <>
          <canvas
            ref={canvasRef}
            width={560}
            height={230}
            className="w-full object-contain cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHovered(null)}
          />
          {hovered && (
            <div className="mt-1 px-3 py-1 bg-[#161b22] border border-[#30363d] rounded-lg text-xs text-gray-300 flex gap-3">
              <span>{hovered.emoji} <span className="text-white font-semibold">{hovered.name}</span></span>
              <span className="text-gray-500">{hovered.category}</span>
              <span style={{ color: hovered.tier === 'hot' ? '#ef4444' : hovered.tier === 'active' ? '#f59e0b' : '#6fbcf0' }}>
                score {hovered.score}
              </span>
              <span className="text-gray-600">{hovered.mutations.toLocaleString()} mutations</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
