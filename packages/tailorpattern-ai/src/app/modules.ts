import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Users,
  Ruler,
  Scissors,
  Wand2,
  Pencil,
  Settings,
  ShoppingBag,
  DollarSign,
  Package,
  Factory,
  UserCheck,
  Store,
  GraduationCap,
  Bot,
} from 'lucide-react'

export type ModuleStatus = 'active' | 'coming-soon' | 'beta'

export interface PlatformModule {
  id: string
  phase: number
  status: ModuleStatus
  label: string
  Icon: LucideIcon
  path: string
  description?: string | undefined
}

export const PLATFORM_MODULES: PlatformModule[] = [
  {
    id: 'dashboard',
    phase: 1,
    status: 'active',
    label: 'Dashboard',
    Icon: LayoutDashboard,
    path: '/',
  },
  {
    id: 'customers',
    phase: 1,
    status: 'active',
    label: 'Customers',
    Icon: Users,
    path: '/customers',
  },
  {
    id: 'measurements',
    phase: 1,
    status: 'active',
    label: 'Measurements',
    Icon: Ruler,
    path: '/measurements',
  },
  {
    id: 'patterns',
    phase: 1,
    status: 'active',
    label: 'Pattern Projects',
    Icon: Scissors,
    path: '/patterns',
  },
  {
    id: 'generator',
    phase: 1,
    status: 'active',
    label: 'Pattern Generator',
    Icon: Wand2,
    path: '/patterns/new',
  },
  {
    id: 'sketch',
    phase: 1,
    status: 'active',
    label: 'Sketch Pad',
    Icon: Pencil,
    path: '/sketch',
  },
  {
    id: 'settings',
    phase: 1,
    status: 'active',
    label: 'Settings',
    Icon: Settings,
    path: '/settings',
  },
  {
    id: 'orders',
    phase: 3,
    status: 'coming-soon',
    label: 'Orders',
    Icon: ShoppingBag,
    path: '/orders',
    description: 'Order management and tracking',
  },
  {
    id: 'finance',
    phase: 4,
    status: 'coming-soon',
    label: 'Finance',
    Icon: DollarSign,
    path: '/finance',
    description: 'Invoicing, payments and financial reports',
  },
  {
    id: 'inventory',
    phase: 5,
    status: 'coming-soon',
    label: 'Inventory',
    Icon: Package,
    path: '/inventory',
    description: 'Fabric and materials management',
  },
  {
    id: 'production',
    phase: 6,
    status: 'coming-soon',
    label: 'Production',
    Icon: Factory,
    path: '/production',
    description: 'Kanban production board',
  },
  {
    id: 'employees',
    phase: 7,
    status: 'coming-soon',
    label: 'Employees',
    Icon: UserCheck,
    path: '/employees',
    description: 'Staff management and RBAC',
  },
  {
    id: 'marketplace',
    phase: 8,
    status: 'coming-soon',
    label: 'TailorMarket™',
    Icon: Store,
    path: '/marketplace',
    description: 'Buy and sell patterns and services',
  },
  {
    id: 'academy',
    phase: 9,
    status: 'coming-soon',
    label: 'Academy',
    Icon: GraduationCap,
    path: '/academy',
    description: 'Learn tailoring and business skills',
  },
  {
    id: 'ai-assistant',
    phase: 10,
    status: 'coming-soon',
    label: 'AI Assistant',
    Icon: Bot,
    path: '/ai-assistant',
    description: 'AI-powered business intelligence',
  },
]
