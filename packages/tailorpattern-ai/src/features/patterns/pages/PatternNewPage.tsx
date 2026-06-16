import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageHeader } from '../../../shared/components/layout/PageHeader'
import { Button } from '../../../shared/components/ui/Button'
import { Input } from '../../../shared/components/ui/Input'
import { GarmentTypeSelector } from '../components/GarmentTypeSelector'
import { StyleParameterPanel } from '../components/StyleParameterPanel'
import { useCustomers } from '../../customers/hooks/useCustomers'
import { useMeasurements } from '../../measurements/hooks/useMeasurements'
import { useCreatePatternProject } from '../hooks/usePatternProjects'
import { usePatternGenerator } from '../hooks/usePatternGenerator'
import { Avatar } from '../../../shared/components/ui/Avatar'
import { cn } from '../../../shared/utils/cn'
import type { GarmentType, StyleParameters } from '../types/pattern.types'

const STEPS = [
  { label: 'Customer', description: 'Select or create a customer' },
  { label: 'Measurements', description: 'Select a measurement set' },
  { label: 'Garment', description: 'Choose the garment type' },
  { label: 'Style', description: 'Configure style parameters' },
  { label: 'Generate', description: 'Review and generate your pattern' },
]

export function PatternNewPage(): JSX.Element {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [selectedMeasurementId, setSelectedMeasurementId] = useState('')
  const [projectName, setProjectName] = useState('')
  const [garmentType, setGarmentType] = useState<GarmentType | null>(null)
  const [styleParams, setStyleParams] = useState<StyleParameters>({ easePreference: 'regular' })
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null)

  const { data: customers } = useCustomers()
  const { data: measurements } = useMeasurements(selectedCustomerId)
  const createProject = useCreatePatternProject()
  const generateMutation = usePatternGenerator(createdProjectId ?? '')

  const selectedCustomer = customers?.find(c => c.id === selectedCustomerId)
  const selectedMeasurement = measurements?.find(m => m.id === selectedMeasurementId)

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return Boolean(selectedCustomerId)
      case 1: return Boolean(selectedMeasurementId)
      case 2: return Boolean(garmentType)
      case 3: return true
      case 4: return Boolean(projectName)
      default: return false
    }
  }

  const handleNext = (): void => {
    if (step < STEPS.length - 1) setStep(s => s + 1)
  }

  const handleGenerate = async (): Promise<void> => {
    if (!garmentType || !selectedMeasurement) return

    const project = await createProject.mutateAsync({
      customerId: selectedCustomerId,
      measurementSetId: selectedMeasurementId,
      name: projectName || `${garmentType} for ${selectedCustomer?.fullName ?? 'Customer'}`,
      garmentType,
      styleParameters: styleParams,
    })

    setCreatedProjectId(project.id)
    await generateMutation.mutateAsync(selectedMeasurement.measurements)
    navigate(`/patterns/${project.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => (step === 0 ? navigate('/patterns') : setStep(s => s - 1))}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-body mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        {step === 0 ? 'Patterns' : STEPS[step - 1]?.label}
      </button>

      {/* Step indicator */}
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
            <span
              className={cn(
                'text-xs font-medium',
                i === step ? 'text-text-primary' : 'text-text-muted',
              )}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={cn('w-6 h-px', i < step ? 'bg-brand-gold' : 'bg-surface-muted')} />
            )}
          </div>
        ))}
      </div>

      <PageHeader
        title={STEPS[step]?.label ?? ''}
        subtitle={STEPS[step]?.description}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {/* Step 0: Customer selection */}
          {step === 0 && (
            <div className="space-y-2">
              {!customers?.length && (
                <p className="text-sm text-text-muted">No customers yet. <button className="text-brand-mid underline" onClick={() => navigate('/customers')}>Add one first.</button></p>
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
                  {selectedCustomerId === c.id && (
                    <Check size={16} className="ml-auto text-brand-gold" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Step 1: Measurement set */}
          {step === 1 && (
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
                    <p className="text-xs text-text-muted">{new Date(ms.takenAt).toLocaleDateString('en-GB')} · {ms.measurements.unit}</p>
                  </div>
                  {ms.isDefault && <span className="text-[10px] font-medium text-brand-gold">Default</span>}
                  {selectedMeasurementId === ms.id && <Check size={16} className="text-brand-gold" />}
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Garment type */}
          {step === 2 && (
            <GarmentTypeSelector
              value={garmentType}
              onChange={type => {
                setGarmentType(type)
                if (!projectName) {
                  setProjectName(`${type.replace(/-/g, ' ')} for ${selectedCustomer?.fullName ?? ''}`)
                }
              }}
            />
          )}

          {/* Step 3: Style parameters */}
          {step === 3 && garmentType && (
            <StyleParameterPanel
              garmentType={garmentType}
              value={styleParams}
              onChange={setStyleParams}
            />
          )}

          {/* Step 4: Review & Generate */}
          {step === 4 && (
            <div className="space-y-4">
              <Input
                label="Project Name"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder="e.g. Kwame’s Wedding Suit"
                required
              />
              <div className="bg-surface-subtle rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Customer</span>
                  <span className="font-medium">{selectedCustomer?.fullName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Measurements</span>
                  <span className="font-medium">{selectedMeasurement?.label}</span>
                </div>
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

      {/* Next button */}
      {step < 4 && (
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
