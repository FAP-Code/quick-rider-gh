import { useState } from 'react'
import { Save } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PageHeader } from '../../../shared/components/layout/PageHeader'
import { Card, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Input } from '../../../shared/components/ui/Input'
import { Select } from '../../../shared/components/ui/Select'
import { Button } from '../../../shared/components/ui/Button'
import { useAuth } from '../../auth/useAuth'
import type { BusinessSettings } from '../../../shared/types/common.types'

export function SettingsPage(): JSX.Element {
  const { business, updateBusiness } = useAuth()
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: business?.name ?? '',
      ownerName: business?.ownerName ?? '',
      email: business?.email ?? '',
      currency: business?.currency ?? 'GBP',
      defaultUnit: business?.settings.defaultUnit ?? 'cm',
      defaultSeamAllowance: business?.settings.defaultSeamAllowance ?? 1.5,
      defaultPaperSize: business?.settings.defaultPaperSize ?? 'A4',
      defaultEasePreference: business?.settings.defaultEasePreference ?? 'regular',
      theme: business?.settings.theme ?? 'system',
    },
  })

  const onSubmit = async (data: {
    name: string
    ownerName: string
    email: string
    currency: string
    defaultUnit: string
    defaultSeamAllowance: number
    defaultPaperSize: string
    defaultEasePreference: string
    theme: string
  }): Promise<void> => {
    setSaving(true)
    try {
      await updateBusiness({
        name: data.name,
        ownerName: data.ownerName,
        email: data.email,
        currency: data.currency as BusinessSettings['defaultUnit'] extends never ? never : never,
        settings: {
          ...business!.settings,
          defaultUnit: data.defaultUnit as 'cm' | 'inches',
          defaultSeamAllowance: Number(data.defaultSeamAllowance),
          defaultPaperSize: data.defaultPaperSize as 'A4' | 'letter',
          defaultEasePreference: data.defaultEasePreference as 'slim' | 'regular' | 'relaxed',
          theme: data.theme as 'light' | 'dark' | 'system',
        },
      } as Parameters<typeof updateBusiness>[0])
      toast.success('Settings saved')
    } finally {
      setSaving(false)
    }
  }

  const handleExport = (): void => {
    const data = JSON.stringify({ business }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tailorpattern-backup.json'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Data exported')
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Settings" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Business Settings</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <Input label="Business Name" {...register('name')} />
            <Input label="Your Name" {...register('ownerName')} />
            <Input label="Email" type="email" {...register('email')} />
            <Select
              label="Currency"
              {...register('currency')}
              options={[
                { value: 'GBP', label: 'GBP (£)' },
                { value: 'USD', label: 'USD ($)' },
                { value: 'EUR', label: 'EUR (€)' },
                { value: 'GHS', label: 'GHS (₵)' },
                { value: 'NGN', label: 'NGN (₦)' },
                { value: 'KES', label: 'KES (Ksh)' },
              ]}
            />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pattern Defaults</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <Select
              label="Default Unit"
              {...register('defaultUnit')}
              options={[
                { value: 'cm', label: 'Centimetres (cm)' },
                { value: 'inches', label: 'Inches' },
              ]}
            />
            <Input
              label="Default Seam Allowance (cm)"
              type="number"
              step="0.5"
              min={0.5}
              max={5}
              {...register('defaultSeamAllowance')}
            />
            <Select
              label="Default Paper Size"
              {...register('defaultPaperSize')}
              options={[
                { value: 'A4', label: 'A4 (210 × 297mm)' },
                { value: 'letter', label: 'US Letter (8.5 × 11in)' },
              ]}
            />
            <Select
              label="Default Ease Preference"
              {...register('defaultEasePreference')}
              options={[
                { value: 'slim', label: 'Slim' },
                { value: 'regular', label: 'Regular' },
                { value: 'relaxed', label: 'Relaxed' },
              ]}
            />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <Select
            label="Theme"
            {...register('theme')}
            options={[
              { value: 'system', label: 'System (auto)' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
        </Card>

        <Button type="submit" loading={saving} leftIcon={<Save size={16} />} fullWidth>
          Save Settings
        </Button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Data & Backup</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          <Button variant="secondary" onClick={handleExport} fullWidth>
            Export All Data (JSON)
          </Button>
          <p className="text-xs text-text-muted text-center">
            App version 1.0.0 · Phase 1 — TailorPattern AI · The Tailor’s Friend™
          </p>
        </div>
      </Card>
    </div>
  )
}
