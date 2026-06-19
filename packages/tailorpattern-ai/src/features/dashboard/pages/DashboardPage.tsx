import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Scissors, Plus, TrendingUp, FileWarning, Zap, ArrowUpRight } from 'lucide-react'
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
  gradient: string
  index: number
}

function StatCard({ label, value, icon: Icon, gradient, index }: StatCardProps): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      whileHover={{ y: -2 }}
      className="bg-white rounded-2xl border border-surface-muted p-4 shadow-card transition-shadow duration-200 hover:shadow-card-hover"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-text-muted">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient} shadow-sm`}>
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
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-navy via-brand-navy to-brand-mid px-5 py-6 sm:px-7 sm:py-8 text-white shadow-card"
      >
        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-brand-gold/10 blur-2xl" />
        <div className="absolute -bottom-12 -left-8 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Hello, {business?.ownerName ?? 'there'} 👋
            </h1>
            <p className="text-sm text-white/60 mt-1">{business?.name}</p>
            <p className="text-xs text-white/40 mt-3 max-w-sm">
              Here&rsquo;s what&rsquo;s happening with your patterns and customers today.
            </p>
          </div>
          <Button
            size="sm"
            variant="gold"
            onClick={() => navigate('/patterns/new')}
            leftIcon={<Plus size={15} />}
            className="flex-shrink-0"
          >
            New Pattern
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Customers"
          value={customers?.length ?? 0}
          icon={Users}
          gradient="from-brand-navy to-brand-dark"
          index={0}
        />
        <StatCard
          label="Active Patterns"
          value={activePatterns.length}
          icon={Scissors}
          gradient="from-brand-mid to-brand-navy"
          index={1}
        />
        <StatCard
          label="This Month"
          value={thisMonth.length}
          icon={TrendingUp}
          gradient="from-brand-gold to-brand-gold-light"
          index={2}
        />
        <StatCard
          label="Drafts Pending"
          value={drafts.length}
          icon={FileWarning}
          gradient="from-amber-500 to-amber-400"
          index={3}
        />
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/patterns/new')}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-surface-muted bg-gradient-to-br from-brand-gold/8 to-transparent hover:border-brand-gold/40 hover:shadow-card-hover transition-all duration-200 text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-brand-gold/15 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-gold/25 transition-colors">
              <Zap size={16} className="text-brand-gold" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-primary">New Pattern</p>
              <p className="text-xs text-text-muted">Generate a pattern in minutes</p>
            </div>
            <ArrowUpRight size={15} className="text-text-muted group-hover:text-brand-gold transition-colors flex-shrink-0" />
          </button>
          <button
            onClick={() => navigate('/customers')}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-surface-muted bg-gradient-to-br from-brand-navy/5 to-transparent hover:border-brand-navy/30 hover:shadow-card-hover transition-all duration-200 text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-brand-navy/10 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-navy/20 transition-colors">
              <Users size={16} className="text-brand-navy" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-primary">Add Customer</p>
              <p className="text-xs text-text-muted">Save a new client profile</p>
            </div>
            <ArrowUpRight size={15} className="text-text-muted group-hover:text-brand-navy transition-colors flex-shrink-0" />
          </button>
        </div>
      </Card>

      {/* Recent Patterns */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-text-primary">Recent Patterns</h2>
          <button
            onClick={() => navigate('/patterns')}
            className="text-xs font-medium text-brand-mid hover:text-brand-gold transition-colors"
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
