import type { PatternPiece, PatternData, Point, PatternPath } from '../../types/pattern.types'

const PIECE_COLORS: Record<string, string> = {
  '#1A1A2E': '#1A1A2E',
  '#0F3460': '#0F3460',
  '#C9A84C': '#C9A84C',
  '#475569': '#475569',
  '#BFDBFE': '#BFDBFE',
  '#78716C': '#78716C',
}

function pointsToPath(points: Point[], closed: boolean): string {
  if (points.length === 0) return ''
  const [first, ...rest] = points
  if (!first) return ''
  let d = `M ${first.x} ${first.y}`
  for (const p of rest) {
    d += ` L ${p.x} ${p.y}`
  }
  if (closed) d += ' Z'
  return d
}

function renderGrainLine(piece: PatternPiece): string {
  if (!piece.grainLine) return ''
  const { start, end } = piece.grainLine
  const dx = end.x - start.x
  const dy = end.y - start.y
  const len = Math.sqrt(dx * dx + dy * dy)
  const ux = (dx / len) * 2
  const uy = (dy / len) * 2

  return `
    <line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}"
          stroke="#64748b" stroke-width="0.5" stroke-dasharray="3,2"
          marker-start="url(#arrow-start)" marker-end="url(#arrow-end)" />
  `
}

function renderDarts(piece: PatternPiece): string {
  if (!piece.darts?.length) return ''
  return piece.darts
    .map(
      dart => `
    <line x1="${dart.legA.x}" y1="${dart.legA.y}" x2="${dart.apex.x}" y2="${dart.apex.y}"
          stroke="#94a3b8" stroke-width="0.4" stroke-dasharray="2,1" />
    <line x1="${dart.legB.x}" y1="${dart.legB.y}" x2="${dart.apex.x}" y2="${dart.apex.y}"
          stroke="#94a3b8" stroke-width="0.4" stroke-dasharray="2,1" />
  `,
    )
    .join('')
}

function renderFoldLine(path: PatternPath): string {
  if (!path.points.length) return ''
  return `<path d="${pointsToPath(path.points, path.isClosed)}"
          stroke="#6366f1" stroke-width="0.5" stroke-dasharray="5,2,1,2" fill="none" />`
}

function renderNotches(piece: PatternPiece): string {
  if (!piece.notches?.length) return ''
  return piece.notches
    .map(
      n => `
    <polygon
      points="${n.position.x},${n.position.y - 2} ${n.position.x + 1.5},${n.position.y + 1} ${n.position.x - 1.5},${n.position.y + 1}"
      fill="#1A1A2E" />
  `,
    )
    .join('')
}

function renderAnnotations(piece: PatternPiece, showLabels: boolean): string {
  if (!showLabels || !piece.annotations?.length) return ''
  return piece.annotations
    .map(
      a => `
    <text x="${a.position.x}" y="${a.position.y}" text-anchor="middle"
          font-family="Inter, sans-serif" font-size="2.5" fill="#6B7280">
      ${a.label}
    </text>
  `,
    )
    .join('')
}

interface RenderOptions {
  showSeamAllowances?: boolean
  showGrainLines?: boolean
  showLabels?: boolean
  showNotches?: boolean
  scale?: number
}

export function renderPatternToSVG(
  data: PatternData,
  options: RenderOptions = {},
): string {
  const {
    showSeamAllowances = false,
    showGrainLines = true,
    showLabels = true,
    showNotches = true,
    scale = 1,
  } = options

  if (!data.pieces.length) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50" y="50" text-anchor="middle" font-family="sans-serif" font-size="8" fill="#6B7280">No pattern pieces</text></svg>'
  }

  // Calculate layout — arrange pieces horizontally with padding
  const PIECE_PADDING = 10
  let offsetX = PIECE_PADDING
  let totalWidth = PIECE_PADDING
  let maxHeight = 0

  const pieceLayouts = data.pieces.map(piece => {
    const pts = piece.outline.points
    const minX = Math.min(...pts.map(p => p.x))
    const maxX = Math.max(...pts.map(p => p.x))
    const minY = Math.min(...pts.map(p => p.y))
    const maxY = Math.max(...pts.map(p => p.y))
    const w = maxX - minX
    const h = maxY - minY

    const layout = { piece, offsetX, offsetY: PIECE_PADDING, minX, minY, w, h }
    offsetX += w + PIECE_PADDING
    totalWidth += w + PIECE_PADDING
    if (h > maxHeight) maxHeight = h
    return layout
  })

  const viewWidth = totalWidth
  const viewHeight = maxHeight + PIECE_PADDING * 2

  const defs = `
    <defs>
      <marker id="arrow-start" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
        <path d="M4,0 L0,2 L4,4" fill="none" stroke="#64748b" stroke-width="0.5" />
      </marker>
      <marker id="arrow-end" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
        <path d="M0,0 L4,2 L0,4" fill="none" stroke="#64748b" stroke-width="0.5" />
      </marker>
    </defs>
  `

  const pieceSVGs = pieceLayouts
    .map(({ piece, offsetX: ox, offsetY: oy, minX, minY }) => {
      const translateX = ox - minX
      const translateY = oy - minY
      const color = piece.color ?? '#1A1A2E'
      const outlinePath = pointsToPath(piece.outline.points, piece.outline.isClosed)

      return `
      <g transform="translate(${translateX}, ${translateY})" class="pattern-piece">
        <!-- Outline -->
        <path d="${outlinePath}"
              fill="${color}10" stroke="${color}" stroke-width="0.8" fill-opacity="0.08" />
        
        ${showSeamAllowances && piece.seamLine
          ? `<path d="${pointsToPath(piece.seamLine.points, piece.seamLine.isClosed)}"
                   fill="none" stroke="${color}60" stroke-width="0.4" stroke-dasharray="2,1" />`
          : ''}
        
        ${piece.foldLine ? renderFoldLine(piece.foldLine) : ''}
        ${showGrainLines ? renderGrainLine(piece) : ''}
        ${showNotches ? renderNotches(piece) : ''}
        ${renderDarts(piece)}
        ${renderAnnotations(piece, showLabels)}
        
        <!-- Piece name label -->
        ${showLabels ? `
          <text text-anchor="middle" font-family="Inter, sans-serif" font-size="3" font-weight="600"
                fill="${color}" x="${(Math.max(...piece.outline.points.map(p => p.x)) - Math.min(...piece.outline.points.map(p => p.x))) / 2}" y="-3">
            ${piece.name} ${piece.quantity ? `× ${piece.quantity}` : ''}
          </text>` : ''}
      </g>
    `
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 ${viewWidth} ${viewHeight}"
     width="${viewWidth * scale}"
     height="${viewHeight * scale}"
     style="font-family: Inter, sans-serif;">
  ${defs}
  <rect width="${viewWidth}" height="${viewHeight}" fill="#F4F6FB" rx="4" />
  ${pieceSVGs}
</svg>`
}
