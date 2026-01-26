import { BRAND } from '@/lib/config';

export default function HomePage() {
  return (
    <main style={{
      padding: 32,
      maxWidth: 1300,
      margin: "0 auto",
      fontFamily: 'Segoe UI, Arial, sans-serif',
      background: 'linear-gradient(120deg, #e3f2fd 0%, #f5f7fa 100%)',
      minHeight: '100vh',
      boxShadow: '0 8px 32px rgba(33,150,243,0.10)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: 'linear-gradient(90deg, #1976d2 0%, #7c3aed 100%)',
        color: '#fff',
        borderRadius: 22,
        padding: '48px 64px',
        marginBottom: 32,
        boxShadow: '0 4px 24px rgba(33,150,243,0.10)',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
        width: '100%',
        maxWidth: 700,
      }}>
        <img src={BRAND.logoPath} alt="Logo" style={{ width: 64, height: 64, marginBottom: 18, filter: 'drop-shadow(0 2px 8px #1976d2aa)' }} />
        <h1 style={{ fontSize: 44, fontWeight: 900, margin: '0 0 12px 0', letterSpacing: 1 }}>Welcome to {BRAND.app}</h1>
        <p style={{ fontSize: 20, opacity: 0.92, marginBottom: 0, fontWeight: 600 }}>{BRAND.tagline}</p>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'radial-gradient(circle, #fff3 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>
      <div style={{
        background: 'linear-gradient(120deg, #fff 60%, #e3f2fd 100%)',
        border: '2px solid #b0bec5',
        borderRadius: 18,
        padding: '32px 44px',
        boxShadow: '0 4px 24px rgba(33,150,243,0.08)',
        textAlign: 'center',
        maxWidth: 600,
        width: '100%',
        marginBottom: 32,
      }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: '#1976d2', margin: '0 0 12px 0', letterSpacing: 1 }}>Quick Start Guide</h2>
        <ul style={{ textAlign: 'left', margin: '0 auto 18px auto', maxWidth: 420, fontSize: 17, color: '#263238', lineHeight: 1.7, fontWeight: 500 }}>
          <li>1. <b>Login</b> or create your account</li>
          <li>2. <b>Create a workspace</b> for your company or team</li>
          <li>3. <b>Start a campaign</b> and generate your first plan</li>
          <li>4. <b>Run workflows</b> and schedule content</li>
        </ul>
        <a href="/login" style={{
          display: 'inline-block',
          background: 'linear-gradient(90deg, #1976d2 0%, #7c3aed 100%)',
          color: '#fff',
          fontWeight: 800,
          fontSize: 20,
          borderRadius: 12,
          padding: '18px 44px',
          textDecoration: 'none',
          marginTop: 8,
          boxShadow: '0 2px 8px rgba(33,150,243,0.10)',
          transition: 'all 0.2s',
        }}>Go to Login</a>
      </div>
      <div style={{ color: '#607d8b', fontSize: 15, marginTop: 18, textAlign: 'center', opacity: 0.7 }}>
        Need help? See the <a href="/app/manual" style={{ color: '#1976d2', textDecoration: 'underline', fontWeight: 700 }}>Owners Manual</a> for a full guide.
      </div>
    </main>
  );
}
