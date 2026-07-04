import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Plus, Ruler, Scissors, FileText } from 'lucide-react'
import { Avatar } from '../../../shared/components/ui/Avatar'
import { Badge } from '../../../shared/components/ui/Badge'
import { Button } from '../../../shared/components/ui/Button'
import { Drawer } from '../../../shared/components/ui/Drawer'
import { Skeleton } from '../../../shared/components/ui/Skeleton'
import { CustomerForm } from '../components/CustomerForm'
import { DigitalTwinCard } from '../components/DigitalTwinCard'
import { useCustomer } from '../hooks/useCustomers'
import { useUpdateCustomer } from '../hooks/useCustomerMutations'
import { useMeasurements } from '../../measurements/hooks/useMeasurements'
import { usePatternProjectsByCustomer } from '../../patterns/hooks/usePatternProjects'
import type { CustomerFormData } from '../types/customer.types'

type Tab = 'overview' | 'measurements' | 'patterns' | 'notes'

export function CustomerDetailPage(): JSX.Element {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)

  const { data: customer, isLoading } = useCustomer(id)
  const updateMutation = useUpdateCustomer(id)
  const { data: customerPatterns } = usePatternProjectsByCustomer(id)
  const { data: measurementSets } = useMeasurements(id)

  // Find the most recent customer-photo reference for the measurement assistant
  const latestPhotoUrl = customerPatterns
    ?.filter(p => p.inputMethod === 'customer-photo' && p.photoReferenceUrl)
    .at(0)
    ?.photoReferenceUrl ?? null

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="bg-white rounded-2xl p-6 space-y-3">
          <Skeleton className="h-12 w-12" rounded="full" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted">Customer not found</p>
        <Button onClick={() => navigate('/customers')} variant="ghost" size="sm" className="mt-4">
          Back to Customers
        </Button>
      </div>
    )
  }

  const handleUpdate = async (data: CustomerFormData): Promise<void> => {
    await updateMutation.mutateAsync(data)
    setEditDrawerOpen(false)
  }

  const TABS: { id: Tab; label: string; icon: typeof Ruler; locked?: boolean }[] = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'measurements', label: 'Measurements', icon: Ruler },
    { id: 'patterns', label: 'Patterns', icon: Scissors },
    { id: 'notes', label: 'Notes', icon: FileText },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/customers')}
          leftIcon={<ArrowLeft size={16} />}
        >
          Customers
        </Button>
      </div>

      {/* Profile header */}
      <div className="bg-white rounded-2xl border border-surface-muted p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={customer.fullName} photoUrl={customer.photoUrl} size="xl" />
            <div>
              <h1 className="text-xl font-bold text-text-primary">{customer.fullName}</h1>
              {customer.phone && (
                <p className="text-sm text-text-muted mt-0.5">{customer.phone}</p>
              )}
              {customer.email && (
                <p className="text-sm text-text-muted">{customer.email}</p>
              )}
              {customer.tags.length > 0 && (
                <div className="flex gap-1.5 mt-2">
                  {customer.tags.map(tag => (
                    <Badge key={tag} variant="info" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Edit size={14} />}
            onClick={() => setEditDrawerOpen(true)}
          >
            Edit
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-muted rounded-xl p-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 flex-1 justify-center py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-text-primary shadow-card'
                : 'text-text-muted hover:text-text-body'
            }`}
          >
            <tab.icon size={14} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-surface-muted p-4">
            <p className="text-xs text-text-muted mb-1">Added</p>
            <p className="text-sm font-medium">{new Date(customer.createdAt).toLocaleDateString('en-GB')}</p>
          </div>
          <div className="bg-white rounded-2xl border border-surface-muted p-4">
            <p className="text-xs text-text-muted mb-1">Status</p>
            <Badge variant={customer.isActive ? 'success' : 'default'}>
              {customer.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          {customer.notes && (
            <div className="col-span-2 bg-white rounded-2xl border border-surface-muted p-4">
              <p className="text-xs text-text-muted mb-2">Notes</p>
              <p className="text-sm text-text-body whitespace-pre-line">{customer.notes}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'measurements' && (
        <div className="space-y-4">
          <Button
            onClick={() => navigate(
              `/measurements/new/${customer.id}`,
              latestPhotoUrl ? { state: { photoUrl: latestPhotoUrl } } : undefined,
            )}
            leftIcon={<Plus size={16} />}
            variant="secondary"
            size="sm"
          >
            Take New Measurements
          </Button>

          {/* Digital twin card — shows default or most recent set */}
          <DigitalTwinCard
            measurementSet={
              measurementSets?.find(s => s.isDefault) ??
              measurementSets?.[0] ??
              null
            }
          />

          {/* Existing sets list */}
          {measurementSets && measurementSets.length > 0 ? (
            <div className="space-y-2">
              {measurementSets.map(set => (
                <div key={set.id} className="bg-white rounded-xl border border-surface-muted px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{set.label}</p>
                    <p className="text-xs text-text-muted">{new Date(set.takenAt).toLocaleDateString('en-GB')}</p>
                  </div>
                  {set.isDefault && (
                    <Badge variant="info" size="sm">Default</Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted text-center py-4">
              No measurement sets yet for {customer.fullName}.
            </p>
          )}
        </div>
      )}

      {activeTab === 'patterns' && (
        <div className="space-y-3">
          <Button
            onClick={() => navigate('/patterns/new')}
            leftIcon={<Plus size={16} />}
            variant="secondary"
            size="sm"
          >
            New Pattern Project
          </Button>
          <p className="text-sm text-text-muted text-center py-8">
            Pattern projects for {customer.fullName} will appear here.
          </p>
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="bg-white rounded-2xl border border-surface-muted p-4">
          <p className="text-sm text-text-body whitespace-pre-line">
            {customer.notes ?? 'No notes yet.'}
          </p>
        </div>
      )}

      <Drawer
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        title="Edit Customer"
        side="right"
      >
        <CustomerForm
          defaultValues={{
            fullName: customer.fullName,
            email: customer.email,
            phone: customer.phone,
            notes: customer.notes,
            tags: customer.tags,
            preferredContactMethod: customer.preferredContactMethod,
          }}
          onSubmit={data => void handleUpdate(data)}
          isSubmitting={updateMutation.isPending}
          onCancel={() => setEditDrawerOpen(false)}
        />
      </Drawer>
    </div>
  )
}
