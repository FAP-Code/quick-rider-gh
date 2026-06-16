import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../../../shared/components/ui/Button'
import { useAuth } from '../../auth/useAuth'
import { usePWAInstall } from '../../../shared/hooks/usePWAInstall'

const BusinessSetupSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  ownerName: z.string().min(1, 'Your name is required'),
  country: z.string().min(2, 'Country is required'),
  currency: z.string().min(3),
})

type BusinessSetupData = z.infer<typeof BusinessSetupSchema>

export function OnboardingPage(): JSX.Element {
  const navigate = useNavigate()
  const { updateBusiness } = useAuth()
  const { isInstallable, install } = usePWAInstall()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<BusinessSetupData>({
    resolver: zodResolver(BusinessSetupSchema),
    defaultValues: { currency: 'GBP', country: 'GB' },
  })

  const handleSetup = async (data: BusinessSetupData): Promise<void> => {
    setSaving(true)
    await updateBusiness({
      name: data.name,
      ownerName: data.ownerName,
      country: data.country,
      currency: data.currency as 'GBP' | 'USD' | 'EUR' | 'GHS' | 'NGN' | 'KES' | 'ZAR',
      onboardingCompleted: true,
    })
    setSaving(false)
    setStep(2)
  }

  const finish = (): void => navigate('/')

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="text-center space-y-6"
            >
              <div className="w-20 h-20 rounded-3xl bg-brand-gold flex items-center justify-center mx-auto">
                <svg viewBox="0 0 40 40" className="w-10 h-10" fill="none">
                  <path d="M8 10 L20 7 L32 10 L32 22 Q32 32 20 36 Q8 32 8 22 Z" stroke="white" strokeWidth="2" />
                  <path d="M14 20 L18 24 L26 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">TailorPattern AI</h1>
                <p className="text-white/60 text-sm">The Tailor’s Friend™</p>
                <p className="text-white/80 mt-4 text-base">
                  The world’s most intelligent garment pattern generator
                </p>
              </div>
              <p className="text-white/50 text-sm">Let’s set up your workspace in 2 minutes</p>
              <Button
                size="lg"
                variant="gold"
                fullWidth
                rightIcon={<ArrowRight size={18} />}
                onClick={() => setStep(1)}
              >
                Get Started
              </Button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">Business Setup</h2>
                <p className="text-white/60 text-sm mt-1">This takes less than a minute</p>
              </div>

              <form onSubmit={handleSubmit(handleSetup)} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-white/80 block mb-1.5">
                    Business Name <span className="text-brand-gold">*</span>
                  </label>
                  <input
                    className="w-full h-11 px-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand-gold text-sm"
                    placeholder="e.g. Mensah Tailoring Studio"
                    {...register('name')}
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-white/80 block mb-1.5">
                    Your Name <span className="text-brand-gold">*</span>
                  </label>
                  <input
                    className="w-full h-11 px-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand-gold text-sm"
                    placeholder="e.g. Kwame Mensah"
                    {...register('ownerName')}
                  />
                  {errors.ownerName && <p className="text-red-400 text-xs mt-1">{errors.ownerName.message}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-white/80 block mb-1.5">Country</label>
                  <select
                    className="w-full h-11 px-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-brand-gold text-sm"
                    {...register('country')}
                  >
                    <option value="GB" className="text-black">United Kingdom</option>
                    <option value="GH" className="text-black">Ghana</option>
                    <option value="NG" className="text-black">Nigeria</option>
                    <option value="KE" className="text-black">Kenya</option>
                    <option value="ZA" className="text-black">South Africa</option>
                    <option value="US" className="text-black">United States</option>
                    <option value="CA" className="text-black">Canada</option>
                    <option value="NG" className="text-black">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-white/80 block mb-1.5">Currency</label>
                  <select
                    className="w-full h-11 px-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-brand-gold text-sm"
                    {...register('currency')}
                  >
                    <option value="GBP" className="text-black">GBP (£)</option>
                    <option value="USD" className="text-black">USD ($)</option>
                    <option value="GHS" className="text-black">GHS (₵)</option>
                    <option value="NGN" className="text-black">NGN (₦)</option>
                    <option value="KES" className="text-black">KES</option>
                    <option value="EUR" className="text-black">EUR (€)</option>
                  </select>
                </div>

                <Button type="submit" size="lg" variant="gold" fullWidth loading={saving}>
                  Continue
                </Button>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto">
                <Check size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">You’re all set!</h2>
                <p className="text-white/60 text-sm mt-1">
                  TailorPattern AI is ready. Let’s create your first pattern.
                </p>
              </div>
              {isInstallable && (
                <div className="bg-white/10 rounded-2xl p-4 text-left space-y-2">
                  <p className="text-sm font-medium text-white">Install as an app</p>
                  <p className="text-xs text-white/60">Works offline · Installs on home screen · No app store needed</p>
                  <Button variant="secondary" size="sm" onClick={() => void install()} fullWidth>
                    Install TailorPattern AI
                  </Button>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Button
                  size="lg"
                  variant="gold"
                  fullWidth
                  onClick={() => navigate('/patterns/new')}
                >
                  Create Your First Pattern
                </Button>
                <Button variant="ghost" fullWidth onClick={finish} className="text-white/60">
                  Explore Dashboard
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
