import { useNavigate } from 'react-router-dom'
import { Phone, Mail, Ruler, Scissors } from 'lucide-react'
import { motion } from 'framer-motion'
import { Avatar } from '../../../shared/components/ui/Avatar'
import { Badge } from '../../../shared/components/ui/Badge'
import { formatRelativeTime } from '../../../shared/utils/format'
import type { Customer } from '../types/customer.types'

interface CustomerCardProps {
  customer: Customer
  measurementCount?: number
  patternCount?: number
  index?: number
}

export function CustomerCard({
  customer,
  measurementCount = 0,
  patternCount = 0,
  index = 0,
}: CustomerCardProps): JSX.Element {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      onClick={() => navigate(`/customers/${customer.id}`)}
      className="bg-white rounded-2xl border border-surface-muted p-4 flex items-center gap-3 cursor-pointer transition-shadow duration-150 hover:shadow-card-hover active:scale-[0.99]"
    >
      <Avatar name={customer.fullName} photoUrl={customer.photoUrl} size="md" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary truncate">{customer.fullName}</p>
        <div className="flex items-center gap-3 mt-0.5">
          {customer.phone && (
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <Phone size={11} />
              {customer.phone}
            </span>
          )}
          {customer.email && !customer.phone && (
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <Mail size={11} />
              <span className="truncate max-w-[140px]">{customer.email}</span>
            </span>
          )}
        </div>
        {customer.tags.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {customer.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="info" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className="text-[10px] text-text-muted">
          {formatRelativeTime(customer.createdAt)}
        </span>
        <div className="flex gap-1.5">
          {measurementCount > 0 && (
            <Badge variant="default" size="sm">
              <Ruler size={10} />
              {measurementCount}
            </Badge>
          )}
          {patternCount > 0 && (
            <Badge variant="gold" size="sm">
              <Scissors size={10} />
              {patternCount}
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  )
}
