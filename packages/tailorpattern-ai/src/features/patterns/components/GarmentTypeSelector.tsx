import { type ReactNode } from 'react'
import { cn } from '../../../shared/utils/cn'
import type { GarmentType } from '../types/pattern.types'

interface GarmentCategory {
  label: string
  items: Array<{ type: GarmentType; label: string; emoji: string }>
}

const GARMENT_CATEGORIES: GarmentCategory[] = [
  {
    label: "Men's Wear",
    items: [
      { type: 'mens-suit-jacket', label: 'Suit Jacket', emoji: '🤺' },
      { type: 'mens-trouser', label: 'Dress Trousers', emoji: '👔' },
      { type: 'mens-formal-shirt', label: 'Formal Shirt', emoji: '👕' },
      { type: 'mens-casual-shirt', label: 'Casual Shirt', emoji: '👕' },
      { type: 'mens-agbada', label: 'Agbada', emoji: '💘' },
      { type: 'mens-senator', label: 'Senator Wear', emoji: '💘' },
      { type: 'mens-kaftan', label: 'Kaftan', emoji: '💘' },
      { type: 'mens-dashiki', label: 'Dashiki', emoji: '💘' },
    ],
  },
  {
    label: "Women's Wear",
    items: [
      { type: 'womens-blouse', label: 'Blouse', emoji: '👗' },
      { type: 'womens-aline-skirt', label: 'A-Line Skirt', emoji: '👗' },
      { type: 'womens-straight-skirt', label: 'Straight Skirt', emoji: '👗' },
      { type: 'womens-flared-skirt', label: 'Flared Skirt', emoji: '👗' },
      { type: 'womens-shift-dress', label: 'Shift Dress', emoji: '👗' },
      { type: 'womens-fit-flare-dress', label: 'Fit & Flare Dress', emoji: '👗' },
      { type: 'womens-wrap-dress', label: 'Wrap Dress', emoji: '👗' },
      { type: 'womens-suit-jacket', label: 'Ladies Suit Jacket', emoji: '🤺' },
    ],
  },
  {
    label: "Children's Wear",
    items: [
      { type: 'childrens-shirt', label: "Children's Shirt", emoji: '👕' },
      { type: 'childrens-dress', label: "Children's Dress", emoji: '👗' },
      { type: 'childrens-trouser', label: "Children's Trousers", emoji: '👔' },
    ],
  },
  {
    label: 'Business / Uniform',
    items: [
      { type: 'uniform-shirt-m', label: 'Corporate Shirt (M)', emoji: '👕' },
      { type: 'uniform-shirt-f', label: 'Corporate Shirt (F)', emoji: '👕' },
      { type: 'uniform-skirt', label: 'Uniform Skirt', emoji: '👗' },
    ],
  },
]

interface GarmentTypeSelectorProps {
  value: GarmentType | null
  onChange: (type: GarmentType) => void
}

export function GarmentTypeSelector({ value, onChange }: GarmentTypeSelectorProps): JSX.Element {
  return (
    <div className="space-y-6">
      {GARMENT_CATEGORIES.map(cat => (
        <div key={cat.label}>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            {cat.label}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {cat.items.map(item => (
              <button
                key={item.type}
                type="button"
                onClick={() => onChange(item.type)}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all duration-150',
                  value === item.type
                    ? 'border-brand-gold bg-brand-gold/8 text-brand-navy ring-2 ring-brand-gold ring-offset-1'
                    : 'border-surface-muted bg-white text-text-body hover:border-brand-gold/40 hover:bg-surface-subtle',
                )}
              >
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-center leading-tight text-xs">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
