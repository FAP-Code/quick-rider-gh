// Phase 1: owner has all permissions
// Phase 7: Employee Management activates real RBAC

export type Role = 'owner' | 'manager' | 'staff'

export type Permission =
  | 'customers:read'
  | 'customers:write'
  | 'customers:delete'
  | 'measurements:read'
  | 'measurements:write'
  | 'patterns:read'
  | 'patterns:write'
  | 'patterns:generate'
  | 'patterns:export'
  | 'settings:read'
  | 'settings:write'
  | 'data:export'
  | 'data:import'

const ALL_PERMISSIONS: Permission[] = [
  'customers:read',
  'customers:write',
  'customers:delete',
  'measurements:read',
  'measurements:write',
  'patterns:read',
  'patterns:write',
  'patterns:generate',
  'patterns:export',
  'settings:read',
  'settings:write',
  'data:export',
  'data:import',
]

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: ALL_PERMISSIONS,
  manager: [
    'customers:read',
    'customers:write',
    'measurements:read',
    'measurements:write',
    'patterns:read',
    'patterns:write',
    'patterns:generate',
    'patterns:export',
    'settings:read',
    'data:export',
  ],
  staff: [
    'customers:read',
    'measurements:read',
    'measurements:write',
    'patterns:read',
    'patterns:generate',
  ],
}

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}
