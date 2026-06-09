import Link from 'next/link';

export default function NotFound() {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#006633', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: 64 }}>🏍️</div>
          <h1 style={{ fontSize: 48, margin: '16px 0 8px' }}>404</h1>
          <p style={{ color: '#a3d9b0', marginBottom: 24 }}>Page not found</p>
          <a href="/" style={{ background: '#FCD116', color: '#1a1a1a', padding: '12px 24px', borderRadius: 12, fontWeight: 700, textDecoration: 'none' }}>
            Go Home
          </a>
        </div>
      </body>
    </html>
  );
}
