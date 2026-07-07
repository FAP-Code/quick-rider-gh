import { db } from '../../../shared/db'
import { generateId, nowISO } from '../../../shared/utils/uuid'
import { enqueue } from '../../../shared/sync/syncQueue'
import type { Customer, CustomerFormData } from '../types/customer.types'

export async function getCustomers(businessId: string): Promise<Customer[]> {
  return db.customers
    .where('[businessId+isActive]')
    .equals([businessId, 1])
    .filter(c => !c.deletedAt)
    .sortBy('fullName')
}

export async function getCustomer(id: string): Promise<Customer | undefined> {
  return db.customers.get(id)
}

export async function searchCustomers(businessId: string, query: string): Promise<Customer[]> {
  const q = query.toLowerCase()
  const all = await getCustomers(businessId)
  return all.filter(
    c =>
      c.fullName.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q),
  )
}

export async function createCustomer(
  businessId: string,
  data: CustomerFormData,
): Promise<Customer> {
  const now = nowISO()
  const customer: Customer = {
    id: generateId(),
    businessId,
    fullName: data.fullName,
    email: data.email ?? undefined,
    phone: data.phone ?? undefined,
    notes: data.notes ?? undefined,
    tags: data.tags,
    isActive: true,
    preferredContactMethod: data.preferredContactMethod ?? undefined,
    createdAt: now,
    updatedAt: now,
  }
  await db.customers.add(customer)
  await enqueue('create', 'customers', customer.id, customer)
  return customer
}

export async function updateCustomer(
  id: string,
  data: Partial<CustomerFormData>,
): Promise<void> {
  const updates = { ...data, updatedAt: nowISO() }
  await db.customers.update(id, updates)
  await enqueue('update', 'customers', id, updates)
}

export async function deleteCustomer(id: string): Promise<void> {
  const now = nowISO()
  await db.customers.update(id, { deletedAt: now, updatedAt: now })
  await enqueue('delete', 'customers', id, {})
}

export async function getCustomerCount(businessId: string): Promise<number> {
  return db.customers
    .where('businessId')
    .equals(businessId)
    .filter(c => !c.deletedAt && c.isActive)
    .count()
}
