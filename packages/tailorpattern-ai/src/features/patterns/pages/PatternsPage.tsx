import { useState } from 'react'
import { Plus, Scissors } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../../shared/components/layout/PageHeader'
import { Button } from '../../../shared/components/ui/Button'
import { EmptyState } from '../../../shared/components/ui/EmptyState'
import { PatternCardSkeleton } from '../../../shared/components/ui/Skeleton'
import { PatternProjectCard } from '../components/PatternProjectCard'
import { usePatternProjects } from '../hooks/usePatternProjects'

export function PatternsPage(): JSX.Element {
  const navigate = useNavigate()
  const { data: projects, isLoading } = usePatternProjects()

  return (
    <div>
      <PageHeader
        title="Pattern Projects"
        subtitle={projects ? `${projects.length} project${projects.length !== 1 ? 's' : ''}` : ''}
        actions={
          <Button
            onClick={() => navigate('/patterns/new')}
            leftIcon={<Plus size={16} />}
            size="sm"
          >
            New Pattern
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <PatternCardSkeleton key={i} />
          ))}
        </div>
      ) : !projects || projects.length === 0 ? (
        <EmptyState
          icon={<Scissors size={28} />}
          title="No pattern projects yet"
          description="Generate your first garment pattern from customer measurements"
          action={{ label: '+ New Pattern', onClick: () => navigate('/patterns/new') }}
        />
      ) : (
        <div className="space-y-2">
          {projects.map((project, i) => (
            <PatternProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      )}

      <button
        onClick={() => navigate('/patterns/new')}
        className="fixed bottom-24 right-4 lg:hidden w-14 h-14 rounded-full bg-brand-navy text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        aria-label="New Pattern"
      >
        <Plus size={24} />
      </button>
    </div>
  )
}
