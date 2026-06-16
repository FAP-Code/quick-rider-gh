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
import type { Business, Currency, Unit } from '../../../shared/types/common.types'

interface SettingsFormValues {
  name: string
  ownerName: string
  email: string
  currency: Currency
  defaultUnit: Unit
  defaultSeamAllowance: string
  defaultPaperSize: 'A4' | 'letter'
  defaultEasePreference: 'slim' | 'regular' | 'relaxed'
  theme: 'light' | 'dark' | 'system'
}

export function SettingsPage(): JSX.Element {
  const { business, updateBusiness } = useAuth()
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit } = useForm<SettingsFormValues>({
    values: {
      name: business?.name ?? '',
      ownerName: business?.ownerName ?? '',
      email: business?.email ?? '',
      currency: business?.currency ?? 'GBP',
      defaultUnit: business?.settings.defaultUnit ?? 'cm',
      defaultSeamAllowance: String(business?.settings.defaultSeamAllowance ?? 1.5),
      defaultPaperSize: business?.settings.defaultPaperSize ?? 'A4',
      defaultEasePreference: business?.settings.defaultEasePreference ?? 'regular',
      theme: business?.settings.theme ?? 'system',
    },
  })

  const onSubmit = async (data: SettingsFormValues): Promise<void> => {
    if (!business) return
    setSaving(true)
    try {
      await updateBusiness({
        name: data.name,
        ownerName: data.ownerName,
        email: data.email,
        currency: data.currency,
        settings: {
          ...business.settings,
          defaultUnit: data.defaultUnit,
          defaultSeamAllowance: Number(data.defaultSeamAllowance),
          defaultPaperSize: data.defaultPaperSize,
          defaultEasePreference: data.defaultEasePreference,
          theme: data.theme,
        },
      })
      toast.success('Settings saved')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleExport = (): void => {
    if (!business) return
    const json = JSON.stringify({ business, exportedAt: new Date().toISOString() }, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tailorpattern-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Data exported successfully')
  }

  const handleClearCache = async (): Promise<void> => {
    if (!confirm('This will clear the local cache. Your data in IndexedDB is safe. Continue?')) return
    const cacheKeys = await caches.keys()
    await Promise.all(cacheKeys.map(key => caches.delete(key)))
    toast.success('Cache cleared. Refresh the page to reload assets.')
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
            <Input label="Business Name" placeholder="Your tailoring studio name" {...register('name')} />
            <Input label="Your Name" placeholder="e.g. Kwame Mensah" {...register('ownerName')} />
            <Input label="Email Address" type="email" placeholder="you@example.com" {...register('email')} />
            <Select
              label="Currency"
              {...register('currency')}
              options={[
                { value: 'GBP', label: 'GBP (£) — British Pound' },
                { value: 'USD', label: 'USD ($) — US Dollar' },
                { value: 'EUR', label: 'EUR (€) — Euro' },
                { value: 'GHS', label: 'GHS (₵) — Ghana Cedi' },
                { value: 'NGN', label: 'NGN (₦) — Nigerian Naira' },
                { value: 'KES', label: 'KES — Kenyan Shilling' },
                { value: 'ZAR', label: 'ZAR — South African Rand' },
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
              label="Default Measurement Unit"
              {...register('defaultUnit')}
              options={[
                { value: 'cm', label: 'Centimetres (cm)' },
                { value: 'inches', label: 'Inches' },
              ]}
            />
            <Input
              label="Default Seam Allowance"
              type="number"
              step="0.5"
              min="0.5"
              max="5"
              suffix="cm"
              {...register('defaultSeamAllowance')}
            />
            <Select
              label="Default Paper Size (PDF Export)"
              {...register('defaultPaperSize')}
              options={[
                { value: 'A4', label: 'A4 — 210 × 297mm' },
                { value: 'letter', label: 'US Letter — 8.5 × 11in' },
              ]}
            />
            <Select
              label="Default Ease Preference"
              {...register('defaultEasePreference')}
              options={[
                { value: 'slim', label: 'Slim — Fitted silhouette' },
                { value: 'regular', label: 'Regular — Standard fit' },
                { value: 'relaxed', label: 'Relaxed — Comfortable fit' },
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
              { value: 'system', label: 'System (follows device setting)' },
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
          <CardTitle>Data &amp; Sync</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-muted">Storage used</span>
            <span className="font-medium font-measurement">
              {typeof navigator.storage?.estimate === 'function'
                ? 'Available'
                : 'Unknown'}
            </span>
          </div>
          <Button variant="secondary" onClick={handleExport} fullWidth>
            Export All Data (JSON Backup)
          </Button>
          <Button
            variant="secondary"
            onClick={() => void handleClearCache()}
            fullWidth
            className="border-amber-200 text-amber-700 hover:bg-amber-50"
          >
            Clear Asset Cache
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <div className="space-y-1 text-sm text-text-muted">
          <p><span className="font-medium text-text-body">TailorPattern AI</span> — Version 1.0.0</p>
          <p>Phase 1 of 12 — The Tailor’s Friend™</p>
          <p className="text-xs mt-2">© 2025 The Tailor’s Friend™. All Rights Reserved.</p>
        </div>
      </Card>
    </div>
  )
}
