'use client';
import { useEffect, useState } from 'react';
import { ShieldAlert, Phone, MapPin, Share2, AlertTriangle, Siren, UserCheck } from 'lucide-react';

const STORAGE_KEY = 'rider_settings_v1';

const HOTLINES = [
  { label: 'Police Emergency', number: '191', icon: Siren, color: 'bg-red-100 text-red-600' },
  { label: 'Ambulance', number: '193', icon: ShieldAlert, color: 'bg-blue-100 text-blue-600' },
  { label: 'Quick Rider GH Support', number: '+233200000000', icon: UserCheck, color: 'bg-brand-green-100 text-brand-green-700' },
];

export default function RiderSOSPage() {
  const [emergencyContact, setEmergencyContact] = useState<{ name: string; phone: string } | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locError, setLocError] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.emergencyContactPhone) {
          setEmergencyContact({ name: s.emergencyContactName || 'Emergency Contact', phone: s.emergencyContactPhone });
        }
      }
    } catch {}
  }, []);

  function shareLocation() {
    if (!navigator.geolocation) {
      setLocError('Location is not supported on this device');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
        if (navigator.share) {
          navigator.share({ title: 'My current location', text: 'Here is my current location', url }).catch(() => {});
        } else {
          window.open(url, '_blank');
        }
      },
      () => setLocError('Could not get your location. Please enable location services.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><ShieldAlert className="text-red-500" /> Emergency / SOS</h2>
        <p className="text-muted-foreground text-sm mt-1">Quick access to emergency services and contacts</p>
      </div>

      {/* Big SOS button */}
      <a
        href={`tel:${HOTLINES[0].number}`}
        className="block bg-red-500 hover:bg-red-600 text-white rounded-2xl p-6 text-center shadow-lg shadow-red-500/30 transition-colors"
      >
        <AlertTriangle size={36} className="mx-auto mb-2" />
        <p className="text-xl font-bold">Call Emergency Services</p>
        <p className="text-sm text-red-100 mt-1">Tap to call Police ({HOTLINES[0].number})</p>
      </a>

      {/* Share location */}
      <button
        onClick={shareLocation}
        className="w-full bg-card border rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
          <Share2 size={20} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">Share My Live Location</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {location ? `Last shared: ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : 'Send your current location to dispatch or a contact'}
          </p>
          {locError && <p className="text-xs text-red-500 mt-0.5">{locError}</p>}
        </div>
        <MapPin size={18} className="text-muted-foreground" />
      </button>

      {/* Hotlines */}
      <div className="bg-card border rounded-2xl shadow-sm p-5 space-y-3">
        <h3 className="font-semibold text-sm">Emergency Hotlines</h3>
        {HOTLINES.map(({ label, number, icon: Icon, color }) => (
          <a
            key={label}
            href={`tel:${number}`}
            className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/50 transition-colors"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={18} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs text-muted-foreground">{number}</p>
            </div>
            <Phone size={16} className="text-muted-foreground" />
          </a>
        ))}
      </div>

      {/* Personal emergency contact */}
      <div className="bg-card border rounded-2xl shadow-sm p-5 space-y-3">
        <h3 className="font-semibold text-sm">Your Emergency Contact</h3>
        {emergencyContact ? (
          <a
            href={`tel:${emergencyContact.phone}`}
            className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-gold/20 text-brand-gold flex items-center justify-center flex-shrink-0">
              <UserCheck size={18} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{emergencyContact.name}</p>
              <p className="text-xs text-muted-foreground">{emergencyContact.phone}</p>
            </div>
            <Phone size={16} className="text-muted-foreground" />
          </a>
        ) : (
          <p className="text-sm text-muted-foreground">
            No emergency contact set yet. Add one in{' '}
            <a href="/rider/settings" className="text-brand-green-600 font-semibold hover:underline">Settings</a>.
          </p>
        )}
      </div>

      <div className="text-center text-xs text-muted-foreground px-4">
        Stay safe on the road. If you're in immediate danger, contact the police first before notifying anyone else.
      </div>
    </div>
  );
}
