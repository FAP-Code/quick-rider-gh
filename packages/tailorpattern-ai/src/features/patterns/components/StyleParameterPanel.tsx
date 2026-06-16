import { Select } from '../../../shared/components/ui/Select'
import type { GarmentType, StyleParameters } from '../types/pattern.types'

interface StyleParameterPanelProps {
  garmentType: GarmentType
  value: StyleParameters
  onChange: (params: StyleParameters) => void
}

export function StyleParameterPanel({
  garmentType,
  value,
  onChange,
}: StyleParameterPanelProps): JSX.Element {
  const update = (updates: Partial<StyleParameters>): void => {
    onChange({ ...value, ...updates })
  }

  const isSuitJacket = garmentType === 'mens-suit-jacket' || garmentType === 'womens-suit-jacket'
  const isTrouser = garmentType === 'mens-trouser'
  const isShirt =
    garmentType === 'mens-formal-shirt' ||
    garmentType === 'mens-casual-shirt' ||
    garmentType === 'uniform-shirt-m' ||
    garmentType === 'uniform-shirt-f'
  const isSkirt =
    garmentType.includes('skirt') || garmentType.includes('dress')
  const isChildren = garmentType.startsWith('childrens')

  return (
    <div className="space-y-4">
      {/* Universal */}
      <Select
        label="Ease Preference"
        value={value.easePreference ?? 'regular'}
        onChange={e => update({ easePreference: e.target.value as StyleParameters['easePreference'] })}
        options={[
          { value: 'slim', label: 'Slim (minimal ease)' },
          { value: 'regular', label: 'Regular (standard ease)' },
          { value: 'relaxed', label: 'Relaxed (extra ease)' },
        ]}
      />

      {isSuitJacket && (
        <>
          <Select
            label="Lapel Style"
            value={value.lapelStyle ?? 'notch'}
            onChange={e => update({ lapelStyle: e.target.value as StyleParameters['lapelStyle'] })}
            options={[
              { value: 'notch', label: 'Notch Lapel (classic)' },
              { value: 'peak', label: 'Peak Lapel (formal)' },
              { value: 'shawl', label: 'Shawl Collar' },
            ]}
          />
          <Select
            label="Number of Buttons"
            value={String(value.buttonCount ?? 2)}
            onChange={e => update({ buttonCount: parseInt(e.target.value) as 1 | 2 | 3 })}
            options={[
              { value: '1', label: '1 Button' },
              { value: '2', label: '2 Buttons' },
              { value: '3', label: '3 Buttons' },
            ]}
          />
          <Select
            label="Jacket Length"
            value={value.jacketLength ?? 'standard'}
            onChange={e => update({ jacketLength: e.target.value as StyleParameters['jacketLength'] })}
            options={[
              { value: 'short', label: 'Short (+2cm above standard)' },
              { value: 'standard', label: 'Standard' },
              { value: 'long', label: 'Long (+2cm below standard)' },
            ]}
          />
          <Select
            label="Vent Style"
            value={value.ventStyle ?? 'single'}
            onChange={e => update({ ventStyle: e.target.value as StyleParameters['ventStyle'] })}
            options={[
              { value: 'none', label: 'No vent' },
              { value: 'single', label: 'Single vent' },
              { value: 'double', label: 'Double vent' },
            ]}
          />
          <Select
            label="Pocket Style"
            value={value.pocketStyle ?? 'flap'}
            onChange={e => update({ pocketStyle: e.target.value as StyleParameters['pocketStyle'] })}
            options={[
              { value: 'flap', label: 'Flap pocket' },
              { value: 'patch', label: 'Patch pocket' },
              { value: 'welt', label: 'Welt pocket' },
              { value: 'none', label: 'No pockets' },
            ]}
          />
        </>
      )}

      {isTrouser && (
        <>
          <Select
            label="Leg Style"
            value={value.legStyle ?? 'straight'}
            onChange={e => update({ legStyle: e.target.value as StyleParameters['legStyle'] })}
            options={[
              { value: 'slim', label: 'Slim fit' },
              { value: 'straight', label: 'Straight' },
              { value: 'tapered', label: 'Tapered' },
              { value: 'wide', label: 'Wide leg' },
            ]}
          />
          <Select
            label="Waistband Style"
            value={value.waistbandStyle ?? 'regular'}
            onChange={e => update({ waistbandStyle: e.target.value as StyleParameters['waistbandStyle'] })}
            options={[
              { value: 'regular', label: 'Regular' },
              { value: 'high-rise', label: 'High-rise' },
              { value: 'low-rise', label: 'Low-rise' },
            ]}
          />
          <Select
            label="Pleat"
            value={value.pleat ?? 'none'}
            onChange={e => update({ pleat: e.target.value as StyleParameters['pleat'] })}
            options={[
              { value: 'none', label: 'No pleat' },
              { value: 'single', label: 'Single pleat' },
              { value: 'double', label: 'Double pleat' },
            ]}
          />
        </>
      )}

      {isShirt && (
        <Select
          label="Collar Style"
          value={value.collarStyle ?? 'point'}
          onChange={e => update({ collarStyle: e.target.value as StyleParameters['collarStyle'] })}
          options={[
            { value: 'point', label: 'Point collar' },
            { value: 'spread', label: 'Spread collar' },
            { value: 'button-down', label: 'Button-down' },
            { value: 'mandarin', label: 'Mandarin / band collar' },
          ]}
        />
      )}

      {isSkirt && (
        <Select
          label="Length"
          value={value.skirtLength ?? 'knee'}
          onChange={e => update({ skirtLength: e.target.value as StyleParameters['skirtLength'] })}
          options={[
            { value: 'mini', label: 'Mini (above knee)' },
            { value: 'knee', label: 'Knee length' },
            { value: 'midi', label: 'Midi (calf)' },
            { value: 'maxi', label: 'Maxi (ankle)' },
          ]}
        />
      )}

      {isChildren && (
        <Select
          label="Child Age"
          value={String(value.childAge ?? 8)}
          onChange={e => update({ childAge: parseInt(e.target.value) })}
          options={[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14].map(age => ({
            value: String(age),
            label: `Age ${age}`,
          }))}
        />
      )}
    </div>
  )
}
