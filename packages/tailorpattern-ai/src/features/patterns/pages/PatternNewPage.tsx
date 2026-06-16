import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Users, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageHeader } from '../../../shared/components/layout/PageHeader'
import { Button } from '../../../shared/components/ui/Button'
import { Input } from '../../../shared/components/ui/Input'
import { GarmentTypeSelector } from '../components/GarmentTypeSelector'
import { StyleParameterPanel } from '../components/StyleParameterPanel'
import { MeasurementField } from '../../measurements/components/MeasurementField'
import { MEASUREMENT_SECTIONS, MEASUREMENT_SECTIONS_MAP } from '../../measurements/engine/constants'
import { useCustomers } from '../../customers/hooks/useCustomers'
import { useMeasurements } from '../../measurements/hooks/useMeasurements'
import { useCreatePatternProject } from '../hooks/usePatternProjects'
import { usePatternGenerator } from '../hooks/usePatternGenerator'
import { Avatar } from '../../../shared/components/ui/Avatar'
import { cn } from '../../../shared/utils/cn'
import type { GarmentType, StyleParameters } from '../types/pattern.types'
import type { MeasurementData } from '../../measurements/types/measurement.types'

type Mode = 'customer' | 'standalone'

const CUSTOMER_STEPS = [
  { label: 'Customer', description: 'Select or create a customer' },
  { label: 'Measurements', description: 'Select a measurement set' },
  { label: 'Garment', description: 'Choose the garment type' },
  { label: 'Style', description: 'Configure style parameters' },
  { label: 'Generate', description: 'Review and generate your pattern' },
]

const STANDALONE_STEPS = [
  { label: 'Garment', description: 'Choose the garment type' },
  { label: 'Style', description: 'Configure style parameters' },
  { label: 'Measurements', description: 'Enter body measurements' },
  { label: 'Generate', description: 'Review and generate your pattern' },
]

export function PatternNewPage(): JSX.Element {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode | null>(null)
  const [step, setStep] = useState(0)
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [selectedMeasurementId, setSelectedMeasurementId] = useState('')
  const [projectName, setProjectName] = useState('')
  const [garmentType, setGarmentType] = useState<GarmentType | null>(null)
  const [styleParams, setStyleParams] = useState<StyleParameters>({ easePreference: 'regular' })
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null)
  const [standaloneUnit, setStandaloneUnit] = useState<'cm' | 'inches'>('cm')
  const [standaloneMeasurements, setStandaloneMeasurements] = useState<Partial<Record<string, number>>>({})

  const { data: customers } = useCustomers()
  const { data: measurements } = useMeasurements(selectedCustomerId)
  const createProject = useCreatePatternProject()
  const generateMutation = usePatternGenerator(createdProjectId ?? '')

  const selectedCustomer = customers?.find(c => c.id === selectedCustomerId)
  const selectedMeasurement = measurements?.find(m => m.id === selectedMeasurementId)

  const STEPS = mode === 'standalone' ? STANDALONE_STEPS : CUSTOMER_STEPS
  const lastStep = STEPS.length - 1

  const canProceed = (): boolean => {
    if (mode === 'customer') {
      switch (step) {
        case 0: return Boolean(selectedCustomerId)
        case 1: return Boolean(selectedMeasurementId)
        case 2: return Boolean(garmentType)
        case 3: return true
        case 4: return Boolean(projectName)
        default: return false
      }
    }
    // standalone
    switch (step) {
      case 0: return Boolean(garmentType)
      case 1: return true
      case 2: return true
      case 3: return Boolean(projectName)
      default: return false
    }
  }

  const handleBack = (): void => {
    if (step === 0) {
      setMode(null)
    } else {
      setStep(s => s - 1)
    }
  }

  const handleNext = (): void => {
    if (step < lastStep) setStep(s => s + 1)
  }

  const handleGenerate = async (): Promise<void> => {
    if (!garmentType) return

    let measurementsData: MeasurementData
    let custId = ''
    let measSetId = ''
    let defaultName = garmentType.replace(/-/g, ' ')

    if (mode === 'customer') {
      if (!selectedMeasurement) return
      measurementsData = selectedMeasurement.measurements
      custId = selectedCustomerId
      measSetId = selectedMeasurementId
      defaultName = `${defaultName} for ${selectedCustomer?.fullName ?? 'Customer'}`
    } else {
      measurementsData = { ...standaloneMeasurements, unit: standaloneUnit } as unknown as MeasurementData
    }

    const project = await createProject.mutateAsync({
      customerId: custId,
      measurementSetId: measSetId,
      name: projectName || defaultName,
      garmentType,
      styleParameters: styleParams,
    })

    setCreatedProjectId(project.id)
    await generateMutation.mutateAsync(measurementsData)
    navigate(`/patterns/${project.id}`)
  }

  // Mode picker
  if (mode === null) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/patterns')}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-body mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Patterns
        </button>
        <PageHeader title="New Pattern" subtitle="Choose how you want to create this pattern" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <button
            onClick={() => setMode('customer')}
            className="flex flex-col items-start gap-3 p-5 rounded-2xl border-2 border-surface-muted bg-white hover:border-brand-gold hover:bg-brand-gold/5 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-navy/10 flex items-center justify-center group-hover:bg-brand-navy/20 transition-colors">
              <Users size={20} className="text-brand-navy" />
            </div>
            <div>
              <p className="font-semibold text-text-primary">Customer Pattern</p>
              <p className="text-sm text-text-muted mt-0.5">Link pattern to a customer's saved measurements</p>
            </div>
          </button>
          <button
            onClick={() => setMode('standalone')}
            className="flex flex-col items-start gap-3 p-5 rounded-2xl border-2 border-surface-muted bg-white hover:border-brand-gold hover:bg-brand-gold/5 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-gold/20 flex items-center justify-center group-hover:bg-brand-gold/30 transition-colors">
              <Zap size={20} className="text-brand-gold" />
            </div>
            <div>
              <p className="font-semibold text-text-primary">Quick Pattern</p>
              <p className="text-sm text-text-muted mt-0.5">Enter measurements inline, no customer required</p>
            </div>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={handleBack}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-body mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        {step === 0 ? 'Back' : STEPS[step - 1]?.label}
      </button>

      <div className="flex items-center gap-2 mb-8 overflow-x-auto scrollbar-hide">
        {STEPS.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2 flex-shrink-0">
            <div
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                i < step
                  ? 'bg-brand-gold text-brand-dark'
                  : i === step
                    ? 'bg-brand-navy text-white'
                    : 'bg-surface-muted text-text-muted',
              )}
            >
              {i < step ? <Check size={12} /> : i + 1}
            </div>
            <span className={cn('text-xs font-medium', i === step ? 'text-text-primary' : 'text-text-muted')}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={cn('w-6 h-px', i < step ? 'bg-brand-gold' : 'bg-surface-muted')} />
            )}
          </div>
        ))}
      </div>

      <PageHeader title={STEPS[step]?.label ?? ''} subtitle={STEPS[step]?.description} />

      <AnimatePresence mode="wait">
        <motion.div
          key={`${mode}-${step}`}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {/* Customer mode – step 0: pick customer */}
          {mode === 'customer' && step === 0 && (
            <div className="space-y-2">
              {!customers?.length && (
                <p className="text-sm text-text-muted">
                  No customers yet.{' '}
                  <button className="text-brand-mid underline" onClick={() => navigate('/customers')}>
                    Add one first.
                  </button>
                </p>
              )}
              {customers?.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCustomerId(c.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                    selectedCustomerId === c.id
                      ? 'border-brand-gold bg-brand-gold/8 ring-1 ring-brand-gold'
                      : 'border-surface-muted bg-white hover:border-brand-gold/30',
                  )}
                >
                  <Avatar name={c.fullName} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">{c.fullName}</p>
                    {c.phone && <p className="text-xs text-text-muted">{c.phone}</p>}
                  </div>
                  {selectedCustomerId === c.id && <Check size={16} className="ml-auto text-brand-gold" />}
                </button>
              ))}
            </div>
          )}

          {/* Customer mode – step 1: pick measurement set */}
          {mode === 'customer' && step === 1 && (
            <div className="space-y-2">
              {!measurements?.length && (
                <div className="text-center py-8">
                  <p className="text-sm text-text-muted mb-3">No measurements for {selectedCustomer?.fullName}.</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate(`/measurements/new/${selectedCustomerId}`)}
                  >
                    Take Measurements Now
                  </Button>
                </div>
              )}
              {measurements?.map(ms => (
                <button
                  key={ms.id}
                  onClick={() => setSelectedMeasurementId(ms.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                    selectedMeasurementId === ms.id
                      ? 'border-brand-gold bg-brand-gold/8 ring-1 ring-brand-gold'
                      : 'border-surface-muted bg-white hover:border-brand-gold/30',
                  )}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{ms.label}</p>
                    <p className="text-xs text-text-muted">
                      {new Date(ms.takenAt).toLocaleDateString('en-GB')} · {ms.measurements.unit}
                    </p>
                  </div>
                  {ms.isDefault && <span className="text-[10px] font-medium text-brand-gold">Default</span>}
                  {selectedMeasurementId === ms.id && <Check size={16} className="text-brand-gold" />}
                </button>
              ))}
            </div>
          )}

          {/* Garment type – shared (customer step 2, standalone step 0) */}
          {((mode === 'customer' && step === 2) || (mode === 'standalone' && step === 0)) && (
            <GarmentTypeSelector
              value={garmentType}
              onChange={type => {
                setGarmentType(type)
                if (!projectName && mode === 'customer') {
                  setProjectName(`${type.replace(/-/g, ' ')} for ${selectedCustomer?.fullName ?? ''}`)
                }
              }}
            />
          )}

          {/* Style parameters – shared (customer step 3, standalone step 1) */}
          {((mode === 'customer' && step === 3) || (mode === 'standalone' && step === 1)) && garmentType && (
            <StyleParameterPanel garmentType={garmentType} value={styleParams} onChange={setStyleParams} />
          )}

          {/* Standalone only – step 2: inline measurements */}
          {mode === 'standalone' && step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-text-body">Unit</label>
                <select
                  value={standaloneUnit}
                  onChange={e => setStandaloneUnit(e.target.value as 'cm' | 'inches')}
                  className="text-sm border border-surface-muted rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold"
                >
                  <option value="cm">cm</option>
                  <option value="inches">inches</option>
                </select>
                <span className="text-xs text-text-muted">All fields optional</span>
              </div>
              {MEASUREMENT_SECTIONS.map(section => (
                <div key={section}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">{section}</p>
                  <div className="space-y-3">
                    {(MEASUREMENT_SECTIONS_MAP[section] ?? []).map(field => (
                      <MeasurementField
                        key={field.key}
                        field={field}
                        value={standaloneMeasurements[field.key as string]}
                        unit={standaloneUnit}
                        onChange={val => {
                          setStandaloneMeasurements(prev => {
                            const next = { ...prev }
                            if (val === undefined) {
                              delete next[field.key as string]
                            } else {
                              next[field.key as string] = val
                            }
                            return next
                          })
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Review & Generate – shared (customer step 4, standalone step 3) */}
          {((mode === 'customer' && step === 4) || (mode === 'standalone' && step === 3)) && (
            <div className="space-y-4">
              <Input
                label="Project Name"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder={mode === 'customer' ? "e.g. Kwame's Wedding Suit" : 'e.g. Classic Slim Shirt'}
                required
              />
              <div className="bg-surface-subtle rounded-2xl p-4 space-y-2">
                {mode === 'customer' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Customer</span>
                      <span className="font-medium">{selectedCustomer?.fullName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Measurements</span>
                      <span className="font-medium">{selectedMeasurement?.label}</span>
                    </div>
                  </>
                )}
                {mode === 'standalone' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Mode</span>
                    <span className="font-medium">Quick (standalone)</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Garment</span>
                  <span className="font-medium capitalize">{garmentType?.replace(/-/g, ' ')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Ease</span>
                  <span className="font-medium capitalize">{styleParams.easePreference ?? 'regular'}</span>
                </div>
              </div>
              <Button
                fullWidth
                size="lg"
                loading={createProject.isPending || generateMutation.isPending}
                onClick={() => void handleGenerate()}
              >
                Generate Pattern
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {step < lastStep && (
        <div className="mt-6">
          <Button
            fullWidth
            size="lg"
            disabled={!canProceed()}
            rightIcon={<ArrowRight size={16} />}
            onClick={handleNext}
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  )
}
