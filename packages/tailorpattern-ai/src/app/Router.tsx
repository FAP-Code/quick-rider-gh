import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '../shared/components/layout/AppShell'
import { ErrorBoundary } from '../shared/components/feedback/ErrorBoundary'
import { PatternCardSkeleton } from '../shared/components/ui/Skeleton'
import { useOnboardingGuard } from '../shared/hooks/useOnboardingGuard'
import { useAuth } from '../features/auth/useAuth'

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
const SketchPage = lazy(() =>
  import('../features/sketch/pages/SketchPage').then(m => ({ default: m.SketchPage }))
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

function GuardedApp(): JSX.Element {
  useOnboardingGuard()
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-gold flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
              <path d="M4 6L12 4L20 6L20 14Q20 20 12 22Q4 20 4 14Z" stroke="white" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="animate-spin w-5 h-5 border-2 border-brand-gold border-t-transparent rounded-full" />
        </div>
      </div>
    )
  }

  const eb = (label: string, el: JSX.Element): JSX.Element => (
    <ErrorBoundary label={label}>{el}</ErrorBoundary>
  )

  return (
    <AppShell>
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/"                           element={eb('Dashboard',           <DashboardPage />)} />
            <Route path="/customers"                  element={eb('Customers',           <CustomersPage />)} />
            <Route path="/customers/:id"              element={eb('Customer detail',     <CustomerDetailPage />)} />
            <Route path="/measurements"               element={<Navigate to="/customers" replace />} />
            <Route path="/measurements/new/:customerId" element={eb('Measurements',      <MeasurementFormPage />)} />
            <Route path="/patterns"                   element={eb('Patterns',            <PatternsPage />)} />
            <Route path="/patterns/new"               element={eb('New pattern',         <PatternNewPage />)} />
            <Route path="/patterns/:id"               element={eb('Pattern detail',      <PatternDetailPage />)} />
            <Route path="/sketch"                     element={eb('Sketch pad',          <SketchPage />)} />
            <Route path="/settings"                   element={eb('Settings',            <SettingsPage />)} />
            <Route path="*"                           element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </AppShell>
  )
}

export function Router(): JSX.Element {
  return (
    <Routes>
      <Route
        path="/onboarding"
        element={
          <Suspense fallback={<PageLoader />}>
            <OnboardingPage />
          </Suspense>
        }
      />
      <Route path="/*" element={<GuardedApp />} />
    </Routes>
  )
}
