// Simplified body diagram SVG illustration
// Highlights the currently active measurement section

interface BodyDiagramProps {
  activeSection?: string
  className?: string
}

const SECTION_COLORS: Record<string, string> = {
  'Upper Body': '#C9A84C',
  'Neck & Collar': '#0F3460',
  'Arms & Sleeves': '#16213E',
  'Torso Lengths': '#475569',
  'Lower Body': '#1A1A2E',
}

export function BodyDiagram({ activeSection, className }: BodyDiagramProps): JSX.Element {
  const highlight = activeSection ? (SECTION_COLORS[activeSection] ?? '#C9A84C') : '#E8EDF5'

  return (
    <div className={className}>
      <svg viewBox="0 0 60 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
        {/* Head */}
        <ellipse cx="30" cy="12" rx="9" ry="11" fill="#E8EDF5" stroke="#CBD5E1" strokeWidth="0.8" />

        {/* Neck */}
        <rect
          x="26" y="22" width="8" height="7" rx="2"
          fill={activeSection === 'Neck & Collar' ? highlight : '#E8EDF5'}
          stroke="#CBD5E1" strokeWidth="0.8"
        />

        {/* Torso (chest/upper body) */}
        <path
          d="M16 29 L44 29 L46 75 L14 75 Z"
          fill={activeSection === 'Upper Body' || activeSection === 'Torso Lengths' ? highlight + '60' : '#E8EDF5'}
          stroke="#CBD5E1" strokeWidth="0.8"
        />

        {/* Waist/hip indicator */}
        <line x1="14" y1="58" x2="46" y2="58" stroke="#94A3B8" strokeWidth="0.5" strokeDasharray="2,1" />
        <line x1="14" y1="72" x2="46" y2="72" stroke="#94A3B8" strokeWidth="0.5" strokeDasharray="2,1" />

        {/* Left arm */}
        <path
          d="M16 29 L8 29 L5 65 L11 65 L14 35 Z"
          fill={activeSection === 'Arms & Sleeves' ? highlight + '80' : '#E8EDF5'}
          stroke="#CBD5E1" strokeWidth="0.8"
        />
        {/* Right arm */}
        <path
          d="M44 29 L52 29 L55 65 L49 65 L46 35 Z"
          fill={activeSection === 'Arms & Sleeves' ? highlight + '80' : '#E8EDF5'}
          stroke="#CBD5E1" strokeWidth="0.8"
        />

        {/* Left leg */}
        <path
          d="M14 75 L14 140 L26 140 L28 90 L30 90 L30 75 Z"
          fill={activeSection === 'Lower Body' ? highlight + '80' : '#E8EDF5'}
          stroke="#CBD5E1" strokeWidth="0.8"
        />
        {/* Right leg */}
        <path
          d="M46 75 L46 140 L34 140 L32 90 L30 90 L30 75 Z"
          fill={activeSection === 'Lower Body' ? highlight + '80' : '#E8EDF5'}
          stroke="#CBD5E1" strokeWidth="0.8"
        />

        {/* Active section label */}
        {activeSection && (
          <text x="30" y="150" textAnchor="middle" fontSize="4" fill={highlight} fontFamily="Inter">
            {activeSection}
          </text>
        )}
      </svg>
    </div>
  )
}
