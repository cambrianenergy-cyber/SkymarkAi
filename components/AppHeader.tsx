'use client';


import Link from 'next/link';
import { BRAND } from '@/lib/config';
import { useUserRole } from './UserRoleContext';

export default function AppHeader() {
  const { role, workspaceRole, loading } = useUserRole();
  if (loading) return null;

  return (
    <>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #eee', position: 'relative', zIndex: 2 }}>
        <img 
          src={BRAND.logoPath} 
          alt={BRAND.app} 
          style={{ height: 28 }} 
          onError={(e: any) => { e.currentTarget.style.display = 'none'; }} 
        />
        <strong>{BRAND.app}</strong>
        {/* Only show Pricing for non-viewers */}
        {role !== 'viewer' && (
          <Link
            href="/app/pricing"
            style={{
              marginLeft: 24,
              background: 'linear-gradient(90deg, #0ea5e9 0%, #6366f1 100%)',
              color: '#fff',
              padding: '6px 18px',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 15,
              textDecoration: 'none',
              boxShadow: '0 1px 4px 0 rgba(30,41,59,0.08)',
              transition: 'background 0.2s',
            }}
          >
            Pricing
          </Link>
        )}
        {/* Only show admin/founder links for those roles */}
        {role === 'founder' && (
          <Link href="/founder" style={{ marginLeft: 16, color: '#1976d2', fontWeight: 700 }}>Founder Tools</Link>
        )}
        {role === 'admin' && (
          <Link href="/admin" style={{ marginLeft: 16, color: '#1976d2', fontWeight: 700 }}>Admin Tools</Link>
        )}
        <span style={{ marginLeft: 'auto', color: '#667', fontSize: 12 }}>{BRAND.company}</span>
      </header>
      <div style={{
        width: '100%',
        background: 'linear-gradient(90deg, #6366f1 0%, #0ea5e9 100%)',
        padding: '14px 0 10px 0',
        textAlign: 'center',
        fontWeight: 900,
        fontSize: 1.45 + 'rem',
        letterSpacing: 1.2,
        color: '#fff',
        fontFamily: 'Segoe UI, Manrope, Roboto, Arial, sans-serif',
        textShadow: '0 2px 8px rgba(30,41,59,0.10)',
        marginBottom: 0,
        zIndex: 1,
      }}>
        <span style={{ fontFamily: 'Manrope, Segoe UI, Roboto, Arial, sans-serif', fontWeight: 900, letterSpacing: 1.2, fontSize: '1.45rem', display: 'inline-block' }}>
          Built to Think. Designed to Grow.
        </span>
      </div>
    </>
  );
}
