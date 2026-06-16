import type { Point } from '../../types/pattern.types'

export function pointsToSVGPath(points: Point[], closed: boolean): string {
  if (points.length === 0) return ''
  const [first, ...rest] = points
  if (!first) return ''
  let d = `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`
  for (const p of rest) {
    d += ` L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`
  }
  if (closed) d += ' Z'
  return d
}

export function cubicBezierPath(points: Point[], closed: boolean): string {
  if (points.length < 2) return pointsToSVGPath(points, closed)
  const [first, ...rest] = points
  if (!first) return ''
  let d = `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`

  for (let i = 0; i < rest.length; i++) {
    const prev = i === 0 ? first : rest[i - 1]!
    const curr = rest[i]!
    const next = i < rest.length - 1 ? rest[i + 1]! : curr

    const tension = 0.2
    const cp1x = prev.x + (curr.x - (i > 0 ? rest[i - 2]! : prev).x) * tension
    const cp1y = prev.y + (curr.y - (i > 0 ? rest[i - 2]! : prev).y) * tension
    const cp2x = curr.x - (next.x - prev.x) * tension
    const cp2y = curr.y - (next.y - prev.y) * tension
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`
  }
  if (closed) d += ' Z'
  return d
}

export function armholeCurve(shoulderTip: Point, armholeBottom: Point): string {
  // Standard armhole scye — slight concave curve on front, convex at back
  const cpX = armholeBottom.x + (shoulderTip.x - armholeBottom.x) * 0.2
  const cpY = shoulderTip.y + (armholeBottom.y - shoulderTip.y) * 0.5
  return `M ${shoulderTip.x} ${shoulderTip.y} Q ${cpX} ${cpY} ${armholeBottom.x} ${armholeBottom.y}`
}

export function neckCurve(cbNeck: Point, shoulderNeck: Point): string {
  // Standard neck curve — quarter-ellipse approximation
  const cpX = cbNeck.x + (shoulderNeck.x - cbNeck.x) * 0.7
  const cpY = cbNeck.y
  return `M ${cbNeck.x} ${cbNeck.y} Q ${cpX} ${cpY} ${shoulderNeck.x} ${shoulderNeck.y}`
}

export function getBoundingBox(points: Point[]): {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
} {
  if (!points.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 }
  const xs = points.map(p => p.x)
  const ys = points.map(p => p.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const maxX = Math.max(...xs)
  const maxY = Math.max(...ys)
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
}

export function scalePoints(points: Point[], factor: number): Point[] {
  return points.map(p => ({ x: p.x * factor, y: p.y * factor }))
}

export function translatePoints(points: Point[], dx: number, dy: number): Point[] {
  return points.map(p => ({ x: p.x + dx, y: p.y + dy }))
}

export function mirrorPoints(points: Point[], axis: 'x' | 'y', value = 0): Point[] {
  if (axis === 'y') return points.map(p => ({ x: 2 * value - p.x, y: p.y }))
  return points.map(p => ({ x: p.x, y: 2 * value - p.y }))
}
