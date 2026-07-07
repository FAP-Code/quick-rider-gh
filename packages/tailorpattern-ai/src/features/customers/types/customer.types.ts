import { z } from 'zod'

export const CustomerSchema = z.object({
  id: z.string().uuid(),
  businessId: z.string(),
  fullName: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  photoUrl: z.string().optional(),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string()),
  isActive: z.boolean(),
  deletedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  preferredContactMethod: z.enum(['email', 'phone', 'whatsapp']).optional(),
})

export type Customer = z.infer<typeof CustomerSchema>

export const CustomerFormSchema = z.object({
  fullName: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string()),
  preferredContactMethod: z.enum(['email', 'phone', 'whatsapp']).optional(),
})

export type CustomerFormData = z.infer<typeof CustomerFormSchema>
