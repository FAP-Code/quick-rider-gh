'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import {
  Bell, Globe, ShieldAlert, Lock, LogOut, Save, Check,
  HelpCircle, ChevronDown, MessageCircle, Phone, Mail,
} from 'lucide-react';

const STORAGE_KEY = 'customer_settings_v1';

const DEFAULT_SETTINGS = {
  notifyOrders: true,
  notifyPromotions: true,
  notifySound: true,
  language: 'en',
};

const FAQS = [
  { q: 'How do I request a delivery?', a: 'Tap "Request a Delivery" on the Home tab, choose a service type, enter pickup and destination details, then confirm. A nearby rider will be matched automatically.' },
  { q: 'How is the fare calculated?', a: 'Fares are based on distance, estimated time, a base fare, and a small platform fee. You can preview the fare before confirming your request.' },
  { q: 'Can I cancel an order?', a: 'Yes — you can cancel while your order is still Pending or Accepted from the order tracking page.' },
  { q: 'How do I pay for a delivery?', a: 'Choose Cash, Mobile Money (MTN, Telecel, AirtelTigo), or Card as your payment method during checkout.' },
  { q: 'How do I rate my rider?', a: 'After your order is marked Delivered, a rating prompt appears on the tracking page.' },
  { q: 'My rider hasn\'t arrived — what should I do?', a: 'Check the tracking page for live status updates, or contact support below if something seems wrong.' },
];

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

export default function CustomerSettingsPage() {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
    <div className="space-y-6 max-w-2xl mx-auto pb-10">
      <div>
        <h2 className="text-2xl font-bold">Settings & Help</h2>
        <p className="text-muted-foreground text-sm mt-1">Manage your preferences and get support</p>
      </div>

      {/* Notifications */}
      <div className="bg-card border rounded-2xl shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2"><Bell size={16} className="text-brand-green-600" /> Notifications</h3>
        {[
          { key: 'notifyOrders' as const, label: 'Order updates', desc: 'Status changes for your deliveries' },
          { key: 'notifyPromotions' as const, label: 'Promotions & news', desc: 'Occasional offers and platform updates' },
          { key: 'notifySound' as const, label: 'Sound alerts', desc: 'Play a sound for new updates' },
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
      </div>

      <button
        onClick={save}
        className="w-full py-3 rounded-xl bg-brand-green-500 hover:bg-brand-green-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
      >
        {saved ? <><Check size={16} /> Saved</> : <><Save size={16} /> Save Settings</>}
      </button>

      {/* Help Centre */}
      <div className="bg-card border rounded-2xl shadow-sm p-5 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2"><HelpCircle size={16} className="text-brand-green-600" /> Help Centre — FAQs</h3>
        <div className="space-y-2">
          {FAQS.map((f, i) => (
            <div key={i} className="border rounded-xl overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium hover:bg-muted/50 transition-colors">
                {f.q}
                <ChevronDown size={16} className={`flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-3 text-sm text-muted-foreground">{f.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact support */}
      <div className="bg-card border rounded-2xl shadow-sm p-5 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2"><MessageCircle size={16} className="text-brand-green-600" /> Contact Support</h3>
        <a href="tel:+233200000000" className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/50 transition-colors">
          <Phone size={16} className="text-brand-green-500" />
          <div>
            <p className="text-sm font-medium">Call Support</p>
            <p className="text-xs text-muted-foreground">+233 20 000 0000</p>
          </div>
        </a>
        <a href="mailto:support@quickridergh.com" className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/50 transition-colors">
          <Mail size={16} className="text-brand-green-500" />
          <div>
            <p className="text-sm font-medium">Email Support</p>
            <p className="text-xs text-muted-foreground">support@quickridergh.com</p>
          </div>
        </a>
      </div>

      {/* SOS */}
      <div className="bg-red-50 border border-red-200 rounded-2xl shadow-sm p-5 flex items-center gap-3">
        <ShieldAlert size={20} className="text-red-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-700">Emergency?</p>
          <p className="text-xs text-red-600">If you're in immediate danger, contact local emergency services (191 / 192) right away.</p>
        </div>
      </div>

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
