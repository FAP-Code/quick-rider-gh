import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(num);
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy • h:mm a');
}

export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING:        'bg-yellow-100 text-yellow-800',
  ACCEPTED:       'bg-blue-100 text-blue-800',
  RIDER_EN_ROUTE: 'bg-indigo-100 text-indigo-800',
  PICKED_UP:      'bg-purple-100 text-purple-800',
  IN_TRANSIT:     'bg-cyan-100 text-cyan-800',
  DELIVERED:      'bg-teal-100 text-teal-800',
  COMPLETED:      'bg-green-100 text-green-800',
  CANCELLED:      'bg-red-100 text-red-800',
};

export const RIDER_STATUS_COLORS: Record<string, string> = {
  PENDING:  'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  SUSPENDED:'bg-gray-100 text-gray-800',
};

export const USER_STATUS_COLORS: Record<string, string> = {
  ACTIVE:    'bg-green-100 text-green-800',
  SUSPENDED: 'bg-red-100 text-red-800',
  PENDING_VERIFICATION: 'bg-yellow-100 text-yellow-800',
  DEACTIVATED: 'bg-gray-100 text-gray-800',
};
