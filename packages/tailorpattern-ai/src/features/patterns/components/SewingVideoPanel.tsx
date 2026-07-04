import { Play, Video, Lock } from 'lucide-react'
import type { GarmentType } from '../types/pattern.types'

interface VideoCard {
  title: string
  duration: string
  topic: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
}

const VIDEOS: Partial<Record<GarmentType, VideoCard[]>> = {
  'mens-suit-jacket': [
    { title: 'Setting a Tailored Sleeve', duration: '18 min', topic: 'Sleeves', level: 'Advanced' },
    { title: 'Pad-stitching Lapels by Hand', duration: '22 min', topic: 'Lapels', level: 'Advanced' },
    { title: 'Welt Pocket Construction', duration: '14 min', topic: 'Pockets', level: 'Intermediate' },
    { title: 'Jacket Lining: Fell Stitch Method', duration: '16 min', topic: 'Lining', level: 'Intermediate' },
  ],
  'mens-trouser': [
    { title: 'Trouser Fly Front (Zip)', duration: '12 min', topic: 'Fly', level: 'Intermediate' },
    { title: 'Attaching a Waistband', duration: '10 min', topic: 'Waistband', level: 'Beginner' },
    { title: 'Pressing the Perfect Crease', duration: '6 min', topic: 'Pressing', level: 'Beginner' },
    { title: 'Invisible Hem: Hand Slip-stitch', duration: '8 min', topic: 'Hems', level: 'Beginner' },
  ],
  'mens-formal-shirt': [
    { title: 'Constructing a Shirt Collar', duration: '14 min', topic: 'Collar', level: 'Intermediate' },
    { title: 'French Cuff Construction', duration: '12 min', topic: 'Cuffs', level: 'Intermediate' },
    { title: 'Yoke Application (Fell Method)', duration: '10 min', topic: 'Yoke', level: 'Beginner' },
  ],
  'mens-casual-shirt': [
    { title: 'Shirt Placket & Buttons', duration: '11 min', topic: 'Placket', level: 'Beginner' },
    { title: 'Box Pleat Back Yoke', duration: '9 min', topic: 'Yoke', level: 'Beginner' },
  ],
  'womens-blouse': [
    { title: 'Sewing Bust Darts', duration: '8 min', topic: 'Darts', level: 'Beginner' },
    { title: 'Attaching a Collar Band', duration: '12 min', topic: 'Collar', level: 'Intermediate' },
    { title: 'Invisible Zipper Installation', duration: '10 min', topic: 'Zippers', level: 'Intermediate' },
  ],
  'womens-aline-skirt': [
    { title: 'Inserting an Invisible Zipper', duration: '10 min', topic: 'Zippers', level: 'Beginner' },
    { title: 'Skirt Waistband & Hook & Bar', duration: '9 min', topic: 'Waistband', level: 'Beginner' },
    { title: 'Hemming a Flared Skirt', duration: '7 min', topic: 'Hems', level: 'Beginner' },
  ],
  'womens-shift-dress': [
    { title: 'Faced Neckline & Armhole', duration: '13 min', topic: 'Neckline', level: 'Intermediate' },
    { title: 'Lining a Shift Dress', duration: '15 min', topic: 'Lining', level: 'Intermediate' },
  ],
  'womens-wrap-dress': [
    { title: 'Tying a Wrap Dress: Styling Tips', duration: '5 min', topic: 'Styling', level: 'Beginner' },
    { title: 'Bias-binding Neckline', duration: '8 min', topic: 'Neckline', level: 'Intermediate' },
  ],
  'mens-agbada': [
    { title: 'Embroidery Placement for Agbada', duration: '20 min', topic: 'Embroidery', level: 'Advanced' },
    { title: 'Aso-oke Fabric: Cutting & Handling', duration: '12 min', topic: 'Fabric', level: 'Beginner' },
  ],
  'mens-senator': [
    { title: 'Senator Suit Collar & Placket', duration: '14 min', topic: 'Collar', level: 'Intermediate' },
  ],
}

const GENERIC_VIDEOS: VideoCard[] = [
  { title: 'Pressing Techniques for Tailors', duration: '11 min', topic: 'Pressing', level: 'Beginner' },
  { title: 'Seam Finishing: Overlock vs Flat-fell', duration: '9 min', topic: 'Seams', level: 'Beginner' },
  { title: 'Reading a Pattern: Marks & Symbols', duration: '7 min', topic: 'Patterns', level: 'Beginner' },
  { title: 'Hand Stitches Every Tailor Should Know', duration: '15 min', topic: 'Hand-sewing', level: 'Beginner' },
]

const LEVEL_COLORS: Record<VideoCard['level'], string> = {
  Beginner:     'bg-emerald-100 text-emerald-700',
  Intermediate: 'bg-blue-100 text-blue-700',
  Advanced:     'bg-purple-100 text-purple-700',
}

interface SewingVideoPanelProps {
  garmentType: GarmentType
  className?: string
}

export function SewingVideoPanel({ garmentType, className }: SewingVideoPanelProps): JSX.Element {
  const videos = (VIDEOS[garmentType] ?? []).concat(GENERIC_VIDEOS)

  return (
    <div className={`bg-white rounded-2xl border border-surface-muted overflow-hidden ${className ?? ''}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-muted bg-surface-subtle">
        <Video size={13} className="text-brand-mid" />
        <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider flex-1">
          Sewing Tutorials
        </span>
        <span className="text-[10px] font-medium text-amber-700 bg-amber-100 rounded-full px-1.5 py-0.5">
          Coming Soon
        </span>
      </div>

      {/* Video grid */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {videos.map((v, i) => (
          <div
            key={i}
            className="group relative rounded-xl border border-surface-muted bg-surface-subtle overflow-hidden"
          >
            {/* Thumbnail placeholder */}
            <div className="relative bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center h-24">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center backdrop-blur-sm">
                  <Play size={16} className="text-white ml-0.5" fill="white" />
                </div>
              </div>
              {/* Lock overlay — all locked */}
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/30 rounded-full px-1.5 py-0.5">
                <Lock size={9} className="text-white" />
                <span className="text-[9px] text-white font-medium">Soon</span>
              </div>
              {/* Duration */}
              <div className="absolute bottom-2 right-2 bg-black/50 rounded px-1.5 py-0.5">
                <span className="text-[9px] text-white">{v.duration}</span>
              </div>
              {/* Topic chip */}
              <div className="absolute bottom-2 left-2 bg-black/30 rounded px-1.5 py-0.5">
                <span className="text-[9px] text-white">{v.topic}</span>
              </div>
            </div>
            {/* Info */}
            <div className="p-2.5 space-y-1">
              <p className="text-[11px] font-semibold text-text-primary leading-tight">{v.title}</p>
              <span className={`inline-block text-[9px] font-medium rounded-full px-1.5 py-0.5 ${LEVEL_COLORS[v.level]}`}>
                {v.level}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-surface-muted bg-amber-50">
        <p className="text-[9px] text-amber-700 text-center">
          Video tutorials are placeholder cards · actual video content coming soon
        </p>
      </div>
    </div>
  )
}
