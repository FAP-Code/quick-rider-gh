import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '../shared/components/layout/AppShell'
import { ErrorBoundary } from '../shared/components/feedback/ErrorBoundary'
import { PatternCardSkeleton } from '../shared/components/ui/Skeleton'

// Lazy load all route-level components for code splitting
const DashboardPage = lazy(() =>
  import('../features/dashboard/pages/DashboardPage').then(m => ({ default: m.DashboardPage }))
)
const CustomersPage = lazy(() =>
  import('../features/customers/pages/CustomersPage').then(m => ({ default: m.CustomersPage }))
)
const CustomerDetailPage = lazy(() =>
  import('../features/customers/pages/CustomerDetailPage').then(m => ({ default: m.CustomerDetailPage }))
)
const MeasurementFormPage = lazy(() =>
  import('../features/measurements/pages/MeasurementFormPage').then(m => ({ default: m.MeasurementFormPage }))
)
const PatternsPage = lazy(() =>
  import('../features/patterns/pages/PatternsPage').then(m => ({ default: m.PatternsPage }))
)
const PatternNewPage = lazy(() =>
  import('../features/patterns/pages/PatternNewPage').then(m => ({ default: m.PatternNewPage }))
)
const PatternDetailPage = lazy(() =>
  import('../features/patterns/pages/PatternDetailPage').then(m => ({ default: m.PatternDetailPage }))
)
const SettingsPage = lazy(() =>
  import('../features/settings/pages/SettingsPage').then(m => ({ default: m.SettingsPage }))
)
const OnboardingPage = lazy(() =>
  import('../features/onboarding/pages/OnboardingPage').then(m => ({ default: m.OnboardingPage }))
)

function PageLoader(): JSX.Element {
  return (
    <div className="space-y-3 p-4">
      <PatternCardSkeleton />
      <PatternCardSkeleton />
      <PatternCardSkeleton />
    </div>
  )
}

export function Router(): JSX.Element {
  return (
    <Routes>
      <Route path="/onboarding" element={<Suspense fallback={<PageLoader />}><OnboardingPage /></Suspense>} />

      <Route
        path="/*"
        element={
          <AppShell>
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/customers" element={<CustomersPage />} />
                  <Route path="/customers/:id" element={<CustomerDetailPage />} />
                  <Route
                    path="/measurements/new/:customerId"
                    element={<MeasurementFormPage />}
                  />
                  <Route path="/patterns" element={<PatternsPage />} />
                  <Route path="/patterns/new" element={<PatternNewPage />} />
                  <Route path="/patterns/:id" element={<PatternDetailPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </AppShell>
        }
      />
    </Routes>
  )
}
