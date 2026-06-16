import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../../../shared/components/ui/Button'
import { PageHeader } from '../../../shared/components/layout/PageHeader'
import { MeasurementForm } from '../components/MeasurementForm'
import { useCustomer } from '../../customers/hooks/useCustomers'
import { useCreateMeasurement } from '../hooks/useMeasurements'
import type { MeasurementFormData } from '../types/measurement.types'

export function MeasurementFormPage(): JSX.Element {
  const { customerId = '' } = useParams<{ customerId: string }>()
  const navigate = useNavigate()
  const { data: customer } = useCustomer(customerId)
  const createMutation = useCreateMeasurement(customerId)

  const handleSubmit = async (data: MeasurementFormData): Promise<void> => {
    await createMutation.mutateAsync(data)
    navigate(`/customers/${customerId}`)
  }

  return (
    <div className="max-w-2xl mx-auto">
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

      <MeasurementForm
        onSubmit={data => void handleSubmit(data)}
        isSubmitting={createMutation.isPending}
        onCancel={() => navigate(`/customers/${customerId}`)}
      />
    </div>
  )
}
