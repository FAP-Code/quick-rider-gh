import { type ChangeEvent } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '../../../shared/components/ui/Input'

interface CustomerSearchProps {
  value: string
  onChange: (value: string) => void
}

export function CustomerSearch({ value, onChange }: CustomerSearchProps): JSX.Element {
  return (
    <div className="relative">
      <Input
        type="search"
        placeholder="Search by name, phone or email…"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        leftAddon={<Search size={16} />}
        rightAddon={
          value ? (
            <button
              onClick={() => onChange('')}
              className="text-text-muted hover:text-text-body transition-colors"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          ) : undefined
        }
      />
    </div>
  )
}
