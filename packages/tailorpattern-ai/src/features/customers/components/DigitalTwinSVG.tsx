import type { MeasurementData } from '../../measurements/types/measurement.types'

interface DigitalTwinSVGProps {
  measurements: MeasurementData
  className?: string
  showAnnotations?: boolean
}

// Scale factors: 1 measurement-cm → SVG units
const H = 0.72  // horizontal scale
const V = 0.76  // vertical scale

function s(cm: number, scale: number): number {
  return Math.round(cm * scale * 10) / 10
}

export function DigitalTwinSVG({ measurements: m, className, showAnnotations = true }: DigitalTwinSVGProps): JSX.Element {
  const cx = 60 // horizontal centre of 120-wide viewBox

  // Body measurements with fallback defaults
  const chest        = m.chest ?? 96
  const waist        = m.waist ?? 80
  const hips         = m.hips ?? 100
  const shoulder     = m.shoulderWidth ?? 43
  const neck         = m.neckCircumference ?? 38
  const sleeveLen    = m.sleeveLength ?? 64
  const bicep        = m.bicepCircumference ?? 34
  const wrist        = m.wristCircumference ?? 17
  const inseam       = m.trouserInseam ?? 80
  const thigh        = m.thighCircumference ?? 56
  const backLen      = m.backBodyLength ?? 44

  // Half-widths in SVG units
  const chestR   = s(chest / 2, H)
  const waistR   = s(waist / 2, H)
  const hipR     = s(hips / 2, H)
  const shldrR   = s(shoulder / 2, H)
  const neckR    = Math.max(4, s(neck / Math.PI / 2, H))
  const bicepW   = s(bicep / 4, H)
  const wristW   = s(wrist / 4, H)
  const thighW   = s(thigh / 4, H)

  // Vertical positions
  const headR    = 9
  const headCY   = headR
  const neckTop  = headCY + headR
  const shldrY   = neckTop + 7
  const bustY    = shldrY + s(backLen * 0.35, V)
  const waistY   = shldrY + s(backLen * 0.85, V)
  const hipY     = waistY + s(8, V)
  const crotchY  = hipY + s(10, V)
  const hemY     = crotchY + s(inseam, V)
  const armHemY  = shldrY + s(sleeveLen, V)

  // Clip hemY to keep within viewBox
  const viewH    = Math.max(260, hemY + 10)

  // Torso path (front silhouette, left side only — mirrored)
  const torsoLeft = [
    `M ${cx},${shldrY}`,
    `L ${cx - shldrR},${shldrY}`,
    `C ${cx - shldrR - 2},${shldrY + 5} ${cx - chestR},${bustY - 4} ${cx - chestR},${bustY}`,
    `C ${cx - chestR},${bustY + 4} ${cx - waistR},${waistY - 4} ${cx - waistR},${waistY}`,
    `C ${cx - waistR},${waistY + 4} ${cx - hipR},${hipY - 3} ${cx - hipR},${hipY}`,
    `L ${cx - hipR},${crotchY}`,
  ].join(' ')

  const torsoRight = [
    `M ${cx},${shldrY}`,
    `L ${cx + shldrR},${shldrY}`,
    `C ${cx + shldrR + 2},${shldrY + 5} ${cx + chestR},${bustY - 4} ${cx + chestR},${bustY}`,
    `C ${cx + chestR},${bustY + 4} ${cx + waistR},${waistY - 4} ${cx + waistR},${waistY}`,
    `C ${cx + waistR},${waistY + 4} ${cx + hipR},${hipY - 3} ${cx + hipR},${hipY}`,
    `L ${cx + hipR},${crotchY}`,
  ].join(' ')

  // Left leg
  const legGapHalf = 3
  const leftLegPath = [
    `M ${cx - legGapHalf},${crotchY}`,
    `L ${cx - hipR},${crotchY}`,
    `C ${cx - hipR},${crotchY + 4} ${cx - thighW - legGapHalf},${crotchY + 10} ${cx - thighW - legGapHalf},${crotchY + 14}`,
    `L ${cx - wristW * 1.5 - legGapHalf},${hemY}`,
    `L ${cx - legGapHalf},${hemY}`,
    `Z`,
  ].join(' ')

  const rightLegPath = [
    `M ${cx + legGapHalf},${crotchY}`,
    `L ${cx + hipR},${crotchY}`,
    `C ${cx + hipR},${crotchY + 4} ${cx + thighW + legGapHalf},${crotchY + 10} ${cx + thighW + legGapHalf},${crotchY + 14}`,
    `L ${cx + wristW * 1.5 + legGapHalf},${hemY}`,
    `L ${cx + legGapHalf},${hemY}`,
    `Z`,
  ].join(' ')

  // Arms
  const leftArmPath = [
    `M ${cx - shldrR},${shldrY}`,
    `C ${cx - shldrR - 2},${shldrY + 4} ${cx - bicepW - shldrR + 3},${shldrY + 10} ${cx - bicepW - shldrR + 3},${shldrY + 14}`,
    `L ${cx - wristW - shldrR + 5},${armHemY}`,
    `L ${cx - shldrR + 3},${armHemY}`,
    `C ${cx - shldrR + 3},${armHemY - 4} ${cx - shldrR},${shldrY + 20} ${cx - shldrR},${shldrY}`,
  ].join(' ')

  const rightArmPath = [
    `M ${cx + shldrR},${shldrY}`,
    `C ${cx + shldrR + 2},${shldrY + 4} ${cx + bicepW + shldrR - 3},${shldrY + 10} ${cx + bicepW + shldrR - 3},${shldrY + 14}`,
    `L ${cx + wristW + shldrR - 5},${armHemY}`,
    `L ${cx + shldrR - 3},${armHemY}`,
    `C ${cx + shldrR - 3},${armHemY - 4} ${cx + shldrR},${shldrY + 20} ${cx + shldrR},${shldrY}`,
  ].join(' ')

  const fill   = '#E8EDF5'
  const stroke = '#94A3B8'
  const gold   = '#C9A84C'
  const dim    = '#64748B'

  const annotStyle = { fontSize: '4.5px', fontFamily: 'Inter, sans-serif', fill: dim }

  return (
    <svg
      viewBox={`0 0 120 ${viewH}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Digital twin body outline"
    >
      {/* Arms (behind torso) */}
      <path d={leftArmPath}  fill={fill} stroke={stroke} strokeWidth="0.6" />
      <path d={rightArmPath} fill={fill} stroke={stroke} strokeWidth="0.6" />

      {/* Legs */}
      <path d={leftLegPath}  fill={fill} stroke={stroke} strokeWidth="0.6" />
      <path d={rightLegPath} fill={fill} stroke={stroke} strokeWidth="0.6" />

      {/* Torso */}
      <path d={`${torsoLeft} L ${cx - hipR},${crotchY} ${torsoRight.replace('M', 'L').replace(`${cx},${shldrY}`, '')} L ${cx + hipR},${crotchY} Z`}
        fill={fill} stroke={stroke} strokeWidth="0.6" />

      {/* Neck */}
      <rect x={cx - neckR} y={neckTop} width={neckR * 2} height={shldrY - neckTop}
        rx="2" fill={fill} stroke={stroke} strokeWidth="0.6" />

      {/* Head */}
      <ellipse cx={cx} cy={headCY} rx={headR * 0.9} ry={headR}
        fill={fill} stroke={stroke} strokeWidth="0.6" />

      {showAnnotations && (
        <g>
          {/* Chest annotation */}
          <line x1={cx - chestR} y1={bustY} x2={cx - chestR - 8} y2={bustY} stroke={gold} strokeWidth="0.5" />
          <line x1={cx + chestR} y1={bustY} x2={cx + chestR + 8} y2={bustY} stroke={gold} strokeWidth="0.5" />
          <line x1={cx - chestR - 7} y1={bustY - 3} x2={cx + chestR + 7} y2={bustY - 3} stroke={gold} strokeWidth="0.3" strokeDasharray="1.5,1" />
          <text x={cx} y={bustY - 4.5} textAnchor="middle" {...annotStyle}>{chest}cm</text>

          {/* Waist annotation */}
          <line x1={cx - waistR} y1={waistY} x2={cx - waistR - 6} y2={waistY} stroke={gold} strokeWidth="0.5" />
          <line x1={cx + waistR} y1={waistY} x2={cx + waistR + 6} y2={waistY} stroke={gold} strokeWidth="0.5" />
          <line x1={cx - waistR - 5} y1={waistY - 3} x2={cx + waistR + 5} y2={waistY - 3} stroke={gold} strokeWidth="0.3" strokeDasharray="1.5,1" />
          <text x={cx} y={waistY - 4.5} textAnchor="middle" {...annotStyle}>{waist}cm</text>

          {/* Hip annotation */}
          <line x1={cx - hipR} y1={hipY} x2={cx - hipR - 8} y2={hipY} stroke={gold} strokeWidth="0.5" />
          <line x1={cx + hipR} y1={hipY} x2={cx + hipR + 8} y2={hipY} stroke={gold} strokeWidth="0.5" />
          <line x1={cx - hipR - 7} y1={hipY - 3} x2={cx + hipR + 7} y2={hipY - 3} stroke={gold} strokeWidth="0.3" strokeDasharray="1.5,1" />
          <text x={cx} y={hipY - 4.5} textAnchor="middle" {...annotStyle}>{hips}cm</text>

          {/* Shoulder line */}
          <line x1={cx - shldrR} y1={shldrY - 2} x2={cx + shldrR} y2={shldrY - 2} stroke={dim} strokeWidth="0.4" strokeDasharray="1,1" />
          <text x={cx} y={shldrY - 3.5} textAnchor="middle" style={{ fontSize: '3.5px', fontFamily: 'Inter, sans-serif', fill: dim }}>{shoulder}cm shoulder</text>
        </g>
      )}
    </svg>
  )
}
