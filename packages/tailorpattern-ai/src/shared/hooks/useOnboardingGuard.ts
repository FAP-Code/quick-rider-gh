import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'

export function useOnboardingGuard(): void {
  const { business, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (isLoading) return
    if (!business?.onboardingCompleted && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true })
    }
  }, [business, isLoading, location.pathname, navigate])
}
