import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../../../shared/components/ui/Button'
import { PageHeader } from '../../../shared/components/layout/PageHeader'
import { MeasurementForm } from '../components/MeasurementForm'
import { PhotoMeasurementAssistant } from '../components/PhotoMeasurementAssistant'
import { useCustomer } from '../../customers/hooks/useCustomers'
import { useCreateMeasurement } from '../hooks/useMeasurements'
import type { MeasurementFormData } from '../types/measurement.types'

interface LocationState {
  photoUrl?: string
}

export function MeasurementFormPage(): JSX.Element {
  const { customerId = '' } = useParams<{ customerId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { data: customer } = useCustomer(customerId)
  const createMutation = useCreateMeasurement(customerId)

  const photoUrl = (location.state as LocationState | null)?.photoUrl ?? null
  const [activeSection, setActiveSection] = useState<string>('Upper Body')

  const handleSubmit = async (data: MeasurementFormData): Promise<void> => {
    await createMutation.mutateAsync(data)
    navigate(`/customers/${customerId}`)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/customers/${customerId}`)}
          leftIcon={<ArrowLeft size={16} />}
        >
          {customer?.fullName ?? 'Back'}
        </Button>
      </div>

      <PageHeader
        title="New Measurements"
        subtitle={customer ? `For ${customer.fullName}` : ''}
      />

      {/* Two-column layout on lg screens: assistant left, form right */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start">
        {/* Photo assistant sidebar — sticky on large screens */}
        <div className="lg:sticky lg:top-4">
          <PhotoMeasurementAssistant
            photoUrl={photoUrl}
            activeSection={activeSection}
          />
        </div>

        {/* Measurement form */}
        <div className="max-w-2xl">
          <MeasurementForm
            onSubmit={data => void handleSubmit(data)}
            isSubmitting={createMutation.isPending}
            onCancel={() => navigate(`/customers/${customerId}`)}
            onSectionChange={setActiveSection}
          />
        </div>
      </div>
    </div>
  )
}
