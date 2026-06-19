import type { Point, PatternPath, NotchMark } from '../../types/pattern.types'

function normalize(v: Point): Point {
  const len = Math.hypot(v.x, v.y) || 1
  return { x: v.x / len, y: v.y / len }
}

function lineIntersect(p1: Point, p2: Point, p3: Point, p4: Point): Point | null {
  const d1x = p2.x - p1.x
  const d1y = p2.y - p1.y
  const d2x = p4.x - p3.x
  const d2y = p4.y - p3.y
  const denom = d1x * d2y - d1y * d2x
  if (Math.abs(denom) < 1e-9) return null
  const t = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / denom
  return { x: p1.x + t * d1x, y: p1.y + t * d1y }
}

/**
 * Offsets a closed polygon outward by `distance` using per-edge normals,
 * intersecting consecutive offset edges to find new vertices. This is the
 * standard "true" seam-allowance offset (vs. naively shifting coordinates).
 */
export function offsetPolygon(points: Point[], distance: number): Point[] {
  const n = points.length
  if (n < 3 || distance === 0) return points

  let area = 0
  for (let i = 0; i < n; i++) {
    const p1 = points[i]!
    const p2 = points[(i + 1) % n]!
    area += p1.x * p2.y - p2.x * p1.y
  }
  const sign = area >= 0 ? 1 : -1

  const offsetEdges: Array<{ a: Point; b: Point }> = []
  for (let i = 0; i < n; i++) {
    const p1 = points[i]!
    const p2 = points[(i + 1) % n]!
    const edge = { x: p2.x - p1.x, y: p2.y - p1.y }
    const normal = normalize({ x: edge.y, y: -edge.x })
    const dx = normal.x * sign * distance
    const dy = normal.y * sign * distance
    offsetEdges.push({ a: { x: p1.x + dx, y: p1.y + dy }, b: { x: p2.x + dx, y: p2.y + dy } })
  }

  const result: Point[] = []
  for (let i = 0; i < n; i++) {
    const prev = offsetEdges[(i - 1 + n) % n]!
    const curr = offsetEdges[i]!
    result.push(lineIntersect(prev.a, prev.b, curr.a, curr.b) ?? curr.a)
  }
  return result
}

/** Builds the seam-allowance line for a closed pattern piece outline. */
export function buildSeamLine(outline: PatternPath, distance: number): PatternPath {
  if (!outline.isClosed) return outline
  return {
    isClosed: true,
    isSeamLine: true,
    points: offsetPolygon(outline.points, distance),
  }
}

/** Places a notch mark at the midpoint of the edge between points[i] and points[i+1]. */
export function edgeNotch(points: Point[], i: number, angle = 0): NotchMark {
  const a = points[i % points.length]!
  const b = points[(i + 1) % points.length]!
  return { position: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, angle }
}
