'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

const ROLE_HOME: Record<string, string> = {
  ADMIN:    '/dashboard',
  CUSTOMER: '/customer',
  RIDER:    '/rider',
};

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/auth/login`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }) }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      const { user, accessToken, refreshToken } = data.data;
      localStorage.setItem('access_token',  accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      setAuth(user, accessToken, refreshToken);
      router.push(ROLE_HOME[user.role] ?? '/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-green-700 via-brand-green-500 to-brand-green-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-gold mb-4 shadow-lg">
            <span className="text-4xl">🏍️</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Quick Rider GH</h1>
          <p className="text-green-200 mt-1">Fast · Reliable · Ghanaian</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Sign In</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-brand-green-500 focus:ring-2 focus:ring-brand-green-500/20 outline-none transition text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-brand-green-500 focus:ring-2 focus:ring-brand-green-500/20 outline-none transition text-sm" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 px-4 bg-brand-green-500 hover:bg-brand-green-600 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors text-sm">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">Quick Rider GH · Ghana 🇬🇭</p>
        </div>
      </div>
    </div>
  );
}
