import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { PageHeader } from '../../../shared/components/layout/PageHeader'
import { Button } from '../../../shared/components/ui/Button'
import { SketchCanvas } from '../components/SketchCanvas'

export function SketchPage(): JSX.Element {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<ArrowLeft size={16} />}
        onClick={() => navigate(-1)}
      >
        Back
      </Button>

      <PageHeader
        title="Sketch Pad"
        subtitle="Freehand sketches for garment ideas and design references"
      />

      <SketchCanvas className="rounded-2xl overflow-hidden border border-surface-muted shadow-sm" />
    </motion.div>
  )
}
