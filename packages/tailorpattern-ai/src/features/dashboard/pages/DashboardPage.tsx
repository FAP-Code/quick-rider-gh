import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Scissors, Plus, TrendingUp, FileWarning } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle } from '../../../shared/components/ui/Card'
import { Button } from '../../../shared/components/ui/Button'
import { Skeleton } from '../../../shared/components/ui/Skeleton'
import { PatternProjectCard } from '../../patterns/components/PatternProjectCard'
import { usePatternProjects } from '../../patterns/hooks/usePatternProjects'
import { useCustomers } from '../../customers/hooks/useCustomers'
import { useAuth } from '../../auth/useAuth'
import { getPendingCount } from '../../../shared/sync/syncQueue'

interface StatCardProps {
  label: string
  value: number | string
  icon: typeof Users
  color: string
  index: number
}

function StatCard({ label, value, icon: Icon, color, index }: StatCardProps): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className="bg-white rounded-2xl border border-surface-muted p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-text-muted">{label}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={16} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-text-primary font-measurement">{value}</p>
    </motion.div>
  )
}

export function DashboardPage(): JSX.Element {
  const navigate = useNavigate()
  const { business } = useAuth()
  const { data: patterns, isLoading: patternsLoading } = usePatternProjects()
  const { data: customers } = useCustomers()
  const [pendingSync, setPendingSync] = useState(0)

  useEffect(() => {
    void getPendingCount().then(setPendingSync)
  }, [])

  const activePatterns = patterns?.filter(p => p.status !== 'archived') ?? []
  const drafts = patterns?.filter(p => p.status === 'draft') ?? []
  const thisMonth = patterns?.filter(p => {
    const d = new Date(p.createdAt)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }) ?? []

  const recentProjects = activePatterns.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">
          Hello, {business?.ownerName ?? 'there'} 👋
        </h1>
        <p className="text-sm text-text-muted mt-0.5">{business?.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Customers"
          value={customers?.length ?? 0}
          icon={Users}
          color="bg-brand-navy"
          index={0}
        />
        <StatCard
          label="Active Patterns"
          value={activePatterns.length}
          icon={Scissors}
          color="bg-brand-mid"
          index={1}
        />
        <StatCard
          label="This Month"
          value={thisMonth.length}
          icon={TrendingUp}
          color="bg-brand-gold"
          index={2}
        />
        <StatCard
          label="Drafts Pending"
          value={drafts.length}
          icon={FileWarning}
          color="bg-amber-500"
          index={3}
        />
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => navigate('/patterns/new')}
            leftIcon={<Plus size={16} />}
          >
            New Pattern
          </Button>
          <Button
            onClick={() => navigate('/customers')}
            variant="secondary"
            leftIcon={<Users size={16} />}
          >
            Add Customer
          </Button>
        </div>
      </Card>

      {/* Recent Patterns */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-text-primary">Recent Patterns</h2>
          <button
            onClick={() => navigate('/patterns')}
            className="text-xs text-brand-mid hover:underline"
          >
            View all
          </button>
        </div>
        {patternsLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : recentProjects.length === 0 ? (
          <div className="text-center py-8 text-sm text-text-muted">
            No patterns yet.
            <button onClick={() => navigate('/patterns/new')} className="text-brand-mid underline ml-1">
              Create your first pattern.
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentProjects.map((project, i) => (
              <PatternProjectCard key={project.id} project={project} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Sync status */}
      {pendingSync > 0 && (
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <TrendingUp size={16} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">{pendingSync} items pending sync</p>
              <p className="text-xs text-text-muted">Changes saved locally, will sync when online</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
