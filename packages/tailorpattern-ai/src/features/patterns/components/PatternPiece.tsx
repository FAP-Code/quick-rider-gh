import type { PatternPiece as PatternPieceType, Point } from '../types/pattern.types'

function pointsToD(points: Point[], closed: boolean): string {
  if (!points.length) return ''
  const [first, ...rest] = points
  if (!first) return ''
  let d = `M${first.x},${first.y}`
  for (const p of rest) d += ` L${p.x},${p.y}`
  if (closed) d += ' Z'
  return d
}

interface PatternPieceProps {
  piece: PatternPieceType
  showSeamLine?: boolean
  showGrainLine?: boolean
  showLabels?: boolean
  offsetX?: number
  offsetY?: number
}

export function PatternPieceSVG({
  piece,
  showSeamLine = false,
  showGrainLine = true,
  showLabels = true,
  offsetX = 0,
  offsetY = 0,
}: PatternPieceProps): JSX.Element {
  const color = piece.color ?? '#1A1A2E'
  const outlineD = pointsToD(piece.outline.points, piece.outline.isClosed)

  return (
    <g transform={`translate(${offsetX}, ${offsetY})`}>
      {/* Outline */}
      <path d={outlineD} fill={`${color}14`} stroke={color} strokeWidth={0.8} />

      {/* Seam line */}
      {showSeamLine && piece.seamLine && (
        <path
          d={pointsToD(piece.seamLine.points, piece.seamLine.isClosed)}
          fill="none"
          stroke={`${color}80`}
          strokeWidth={0.4}
          strokeDasharray="2,1"
        />
      )}

      {/* Fold line */}
      {piece.foldLine && (
        <path
          d={pointsToD(piece.foldLine.points, piece.foldLine.isClosed)}
          fill="none"
          stroke="#6366f1"
          strokeWidth={0.5}
          strokeDasharray="5,2,1,2"
        />
      )}

      {/* Grain line */}
      {showGrainLine && piece.grainLine && (
        <line
          x1={piece.grainLine.start.x}
          y1={piece.grainLine.start.y}
          x2={piece.grainLine.end.x}
          y2={piece.grainLine.end.y}
          stroke="#64748b"
          strokeWidth={0.5}
          strokeDasharray="3,2"
        />
      )}

      {/* Darts */}
      {piece.darts?.map((dart, i) => (
        <g key={i}>
          <line x1={dart.legA.x} y1={dart.legA.y} x2={dart.apex.x} y2={dart.apex.y}
                stroke="#94a3b8" strokeWidth={0.4} strokeDasharray="2,1" />
          <line x1={dart.legB.x} y1={dart.legB.y} x2={dart.apex.x} y2={dart.apex.y}
                stroke="#94a3b8" strokeWidth={0.4} strokeDasharray="2,1" />
        </g>
      ))}

      {/* Labels */}
      {showLabels && piece.annotations?.map((ann, i) => (
        <text key={i} x={ann.position.x} y={ann.position.y}
              textAnchor="middle" fontSize={2.5} fontFamily="Inter, sans-serif" fill="#6B7280">
          {ann.label}
        </text>
      ))}
    </g>
  )
}
