import type { Customer } from '../types/customer.types'
import { CustomerCard } from './CustomerCard'
import { EmptyState } from '../../../shared/components/ui/EmptyState'
import { CustomerCardSkeleton } from '../../../shared/components/ui/Skeleton'
import { Users } from 'lucide-react'

interface CustomerListProps {
  customers: Customer[] | undefined
  isLoading: boolean
  searchQuery?: string
  onAddCustomer?: () => void
}

export function CustomerList({
  customers,
  isLoading,
  searchQuery,
  onAddCustomer,
}: CustomerListProps): JSX.Element {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <CustomerCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!customers || customers.length === 0) {
    return (
      <EmptyState
        icon={<Users size={28} />}
        title={searchQuery ? 'No customers found' : 'No customers yet'}
        description={
          searchQuery
            ? `No results for “${searchQuery}”`
            : 'Add your first customer to start creating patterns'
        }
        action={
          !searchQuery && onAddCustomer
            ? { label: '+ Add Customer', onClick: onAddCustomer }
            : undefined
        }
      />
    )
  }

  return (
    <div className="space-y-2">
      {customers.map((customer, i) => (
        <CustomerCard key={customer.id} customer={customer} index={i} />
      ))}
    </div>
  )
}
