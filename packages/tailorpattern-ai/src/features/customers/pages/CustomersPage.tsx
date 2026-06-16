import { useState } from 'react'
import { Plus, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { PageHeader } from '../../../shared/components/layout/PageHeader'
import { Button } from '../../../shared/components/ui/Button'
import { Drawer } from '../../../shared/components/ui/Drawer'
import { EmptyState } from '../../../shared/components/ui/EmptyState'
import { CustomerCardSkeleton } from '../../../shared/components/ui/Skeleton'
import { CustomerCard } from '../components/CustomerCard'
import { CustomerSearch } from '../components/CustomerSearch'
import { CustomerForm } from '../components/CustomerForm'
import { useCustomers } from '../hooks/useCustomers'
import { useCreateCustomer } from '../hooks/useCustomerMutations'
import type { CustomerFormData } from '../types/customer.types'

export function CustomersPage(): JSX.Element {
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { data: customers, isLoading } = useCustomers(search)
  const createMutation = useCreateCustomer()

  const handleCreate = async (data: CustomerFormData): Promise<void> => {
    await createMutation.mutateAsync(data)
    setDrawerOpen(false)
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={customers ? `${customers.length} customer${customers.length !== 1 ? 's' : ''}` : ''}
        actions={
          <Button
            onClick={() => setDrawerOpen(true)}
            leftIcon={<Plus size={16} />}
            size="sm"
          >
            New Customer
          </Button>
        }
      />

      <div className="space-y-4">
        <CustomerSearch value={search} onChange={setSearch} />

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <CustomerCardSkeleton key={i} />
            ))}
          </div>
        ) : !customers || customers.length === 0 ? (
          <EmptyState
            icon={<Users size={28} />}
            title={search ? 'No customers found' : 'No customers yet'}
            description={
              search
                ? `No results for “${search}” — try a different search`
                : 'Add your first customer to start creating patterns'
            }
            action={
              !search
                ? { label: '+ Add Customer', onClick: () => setDrawerOpen(true) }
                : undefined
            }
          />
        ) : (
          <div className="space-y-2">
            {customers.map((customer, i) => (
              <CustomerCard key={customer.id} customer={customer} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* FAB on mobile */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-24 right-4 lg:hidden w-14 h-14 rounded-full bg-brand-navy text-white shadow-lg flex items-center justify-center text-xl active:scale-95 transition-transform"
        aria-label="New Customer"
      >
        <Plus size={24} />
      </button>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="New Customer"
        side="right"
      >
        <CustomerForm
          onSubmit={data => void handleCreate(data)}
          isSubmitting={createMutation.isPending}
          onCancel={() => setDrawerOpen(false)}
        />
      </Drawer>
    </div>
  )
}
