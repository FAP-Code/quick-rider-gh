'use client';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CalendarDays, Clock, Check, Save } from 'lucide-react';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
const DAY_LABELS: Record<string, string> = {
  MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday',
  THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday', SUN: 'Sunday',
};

const HOUR_OPTIONS: { value: string; label: string }[] = [];
for (let h = 6; h <= 22; h++) {
  const suffix = h < 12 ? 'am' : h === 12 ? 'pm' : 'pm';
  const display = h <= 12 ? h : h - 12;
  HOUR_OPTIONS.push({ value: `${String(h).padStart(2, '0')}:00`, label: `${display}:00 ${suffix}` });
}

type DayKey = typeof DAYS[number];

interface DaySchedule {
  active:    boolean;
  startTime: string;
  endTime:   string;
}

const DEFAULT_DAY: DaySchedule = { active: false, startTime: '08:00', endTime: '18:00' };

function initSchedule(): Record<DayKey, DaySchedule> {
  const s: any = {};
  for (const d of DAYS) s[d] = { ...DEFAULT_DAY };
  return s;
}

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

function computeNextWindow(schedule: Record<DayKey, DaySchedule>): string {
  const today   = new Date();
  const todayDow = today.getDay(); // 0=Sun
  const dayOrder = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

  for (let offset = 0; offset < 7; offset++) {
    const idx = (todayDow + offset) % 7;
    const key = dayOrder[idx] as DayKey;
    const sched = schedule[key];
    if (!sched.active) continue;

    const [sh, sm] = sched.startTime.split(':').map(Number);
    const start = new Date(today);
    start.setDate(today.getDate() + offset);
    start.setHours(sh, sm, 0, 0);

    if (start > today) {
      const label = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : DAY_LABELS[key];
      return `${label} at ${HOUR_OPTIONS.find(o => o.value === sched.startTime)?.label ?? sched.startTime}`;
    }
  }
  return 'No upcoming scheduled window';
}

export default function RiderSchedulePage() {
  const qc = useQueryClient();
  const [schedule, setSchedule] = useState<Record<DayKey, DaySchedule>>(initSchedule);
  const [saved,    setSaved]    = useState(false);
  const [err,      setErr]      = useState('');

  const { data: schedData } = useQuery<{ data: any }>({
    queryKey: ['rider-schedule'],
    queryFn: () => api.get('/rider/schedule'),
  });

  const { data: profileData } = useQuery<{ data: any }>({
    queryKey: ['rider-profile'],
    queryFn: () => api.get('/riders/me'),
  });

  const profile  = profileData?.data ?? profileData;
  const isOnline = profile?.availabilityStatus === 'ONLINE';

  useEffect(() => {
    if (!schedData) return;
    const raw = schedData?.data ?? schedData;
    if (raw && typeof raw === 'object') {
      setSchedule((prev) => {
        const merged = initSchedule();
        for (const d of DAYS) {
          if (raw[d]) merged[d] = { ...DEFAULT_DAY, ...raw[d] };
        }
        return merged;
      });
    }
  }, [schedData]);

  const saveMutation = useMutation({
    mutationFn: (body: any) => api.post('/rider/schedule', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rider-schedule'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (e: any) => setErr(e?.message || 'Failed to save schedule'),
  });

  function updateDay(day: DayKey, field: keyof DaySchedule, value: any) {
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
    setSaved(false);
    setErr('');
  }

  const nextWindow = computeNextWindow(schedule);

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold">Availability Schedule</h2>
        <p className="text-muted-foreground text-sm mt-1">Set the days and hours you&apos;re available to ride</p>
      </div>

      {err && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{err}</div>}

      {/* Current status */}
      <div className="bg-gray-900 text-white rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">Current Status</p>
          <div className={`inline-flex items-center gap-1.5 mt-1.5 text-sm font-semibold px-3 py-1 rounded-full ${isOnline ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-500'}`} />
            {isOnline ? 'Online – Accepting Jobs' : 'Offline'}
          </div>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">Next Window</p>
          <p className="text-sm font-semibold text-white mt-1">{nextWindow}</p>
        </div>
      </div>

      {/* Day schedule rows */}
      <div className="bg-card border rounded-2xl shadow-sm divide-y">
        {DAYS.map((day) => {
          const s = schedule[day];
          return (
            <div key={day} className={`p-4 transition-colors ${s.active ? '' : 'opacity-60'}`}>
              <div className="flex items-center gap-3 mb-3">
                <Toggle checked={s.active} onChange={(v) => updateDay(day, 'active', v)} />
                <div className="flex items-center gap-2">
                  <CalendarDays size={15} className="text-muted-foreground" />
                  <span className="font-semibold text-sm">{DAY_LABELS[day]}</span>
                </div>
                {!s.active && <span className="ml-auto text-xs text-muted-foreground">Rest day</span>}
              </div>

              {s.active && (
                <div className="flex items-center gap-3 pl-14">
                  <div className="flex-1">
                    <label className="block text-xs text-muted-foreground mb-1">Start</label>
                    <select
                      value={s.startTime}
                      onChange={(ev) => updateDay(day, 'startTime', ev.target.value)}
                      className="w-full px-2.5 py-2 text-xs bg-muted rounded-lg outline-none border-0 focus:ring-2 focus:ring-brand-green-500/20"
                    >
                      {HOUR_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <Clock size={14} className="text-muted-foreground mt-4 flex-shrink-0" />
                  <div className="flex-1">
                    <label className="block text-xs text-muted-foreground mb-1">End</label>
                    <select
                      value={s.endTime}
                      onChange={(ev) => updateDay(day, 'endTime', ev.target.value)}
                      className="w-full px-2.5 py-2 text-xs bg-muted rounded-lg outline-none border-0 focus:ring-2 focus:ring-brand-green-500/20"
                    >
                      {HOUR_OPTIONS.filter((o) => o.value > s.startTime).map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={() => { setErr(''); saveMutation.mutate(schedule); }}
        disabled={saveMutation.isPending}
        className="w-full py-3 rounded-xl bg-brand-green-500 hover:bg-brand-green-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {saved
          ? <><Check size={16} /> Schedule Saved</>
          : saveMutation.isPending
          ? 'Saving…'
          : <><Save size={16} /> Save Schedule</>}
      </button>

      <p className="text-xs text-muted-foreground text-center">
        Your schedule determines when you appear available to accept orders. You can still toggle online/offline manually from the dashboard.
      </p>
    </div>
  );
}
