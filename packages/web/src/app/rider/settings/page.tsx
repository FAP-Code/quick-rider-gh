'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { Bell, Globe, Ruler, ShieldAlert, Lock, LogOut, Save, Check } from 'lucide-react';

const STORAGE_KEY = 'rider_settings_v1';

const DEFAULT_SETTINGS = {
  notifyOrders: true,
  notifyPayments: true,
  notifyPromotions: false,
  notifySound: true,
  language: 'en',
  distanceUnit: 'km',
  emergencyContactName: '',
  emergencyContactPhone: '',
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-brand-green-500' : 'bg-gray-300'}`}
    >
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${checked ? 'left-6' : 'left-1'}`} />
    </button>
  );
}

export default function RiderSettingsPage() {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
    } catch {}
  }, []);

  function update<K extends keyof typeof DEFAULT_SETTINGS>(key: K, value: (typeof DEFAULT_SETTINGS)[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaved(false);
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function signOut() {
    clearAuth();
    localStorage.clear();
    router.replace('/auth/login');
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">Manage your preferences and account</p>
      </div>

      {/* Notifications */}
      <div className="bg-card border rounded-2xl shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2"><Bell size={16} className="text-brand-green-600" /> Notifications</h3>
        {[
          { key: 'notifyOrders' as const, label: 'New job & order updates', desc: 'Get notified about new jobs and status changes' },
          { key: 'notifyPayments' as const, label: 'Payments & withdrawals', desc: 'Earnings deposits and withdrawal status' },
          { key: 'notifyPromotions' as const, label: 'Promotions & news', desc: 'Occasional offers and platform updates' },
          { key: 'notifySound' as const, label: 'Sound alerts', desc: 'Play a sound for new job requests' },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <Toggle checked={settings[key]} onChange={(v) => update(key, v)} />
          </div>
        ))}
      </div>

      {/* Preferences */}
      <div className="bg-card border rounded-2xl shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2"><Globe size={16} className="text-brand-green-600" /> App Preferences</h3>
        <div>
          <label className="text-sm font-medium block mb-1.5">Language</label>
          <select
            value={settings.language}
            onChange={(e) => update('language', e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-brand-green-500 focus:ring-2 focus:ring-brand-green-500/20 outline-none"
          >
            <option value="en">English</option>
            <option value="tw">Twi</option>
            <option value="ga">Ga</option>
            <option value="ee">Ewe</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5 flex items-center gap-1.5"><Ruler size={14} /> Distance Unit</label>
          <div className="flex gap-2">
            {['km', 'mi'].map((unit) => (
              <button
                key={unit}
                onClick={() => update('distanceUnit', unit)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  settings.distanceUnit === unit ? 'bg-gray-900 text-brand-gold border-gray-900' : 'border-gray-200 text-muted-foreground hover:bg-muted'
                }`}
              >
                {unit === 'km' ? 'Kilometers' : 'Miles'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Emergency contact */}
      <div className="bg-card border rounded-2xl shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2"><ShieldAlert size={16} className="text-red-500" /> Emergency Contact</h3>
        <p className="text-xs text-muted-foreground -mt-2">Used on the SOS page for quick access during emergencies</p>
        <div>
          <label className="text-sm font-medium block mb-1.5">Contact Name</label>
          <input
            value={settings.emergencyContactName}
            onChange={(e) => update('emergencyContactName', e.target.value)}
            placeholder="e.g. Mum, Spouse, Friend"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-brand-green-500 focus:ring-2 focus:ring-brand-green-500/20 outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">Phone Number</label>
          <input
            value={settings.emergencyContactPhone}
            onChange={(e) => update('emergencyContactPhone', e.target.value)}
            placeholder="0XX XXX XXXX"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-brand-green-500 focus:ring-2 focus:ring-brand-green-500/20 outline-none"
          />
        </div>
      </div>

      <button
        onClick={save}
        className="w-full py-3 rounded-xl bg-brand-green-500 hover:bg-brand-green-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
      >
        {saved ? <><Check size={16} /> Saved</> : <><Save size={16} /> Save Settings</>}
      </button>

      {/* Account */}
      <div className="bg-card border rounded-2xl shadow-sm p-5 space-y-1">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Lock size={16} className="text-brand-green-600" /> Account</h3>
        <button
          onClick={signOut}
          className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  );
}
