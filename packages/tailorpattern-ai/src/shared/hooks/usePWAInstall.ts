import { useState, useEffect, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface PWAInstall {
  isInstallable: boolean
  isInstalled: boolean
  install: () => Promise<boolean>
  dismissInstallPrompt: () => void
}

export function usePWAInstall(): PWAInstall {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(
    window.matchMedia('(display-mode: standalone)').matches,
  )

  useEffect(() => {
    const handler = (e: Event): void => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    const installedHandler = (): void => setIsInstalled(true)

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    return choice.outcome === 'accepted'
  }, [deferredPrompt])

  const dismissInstallPrompt = useCallback((): void => {
    setDeferredPrompt(null)
  }, [])

  return {
    isInstallable: deferredPrompt !== null,
    isInstalled,
    install,
    dismissInstallPrompt,
  }
}
