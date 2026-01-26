'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function UploadLogoPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [isUploading, setUploading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);
    setUploading(true);

    const form = e.currentTarget;
    const fileInput = form.elements.namedItem('file') as HTMLInputElement | null;
    const file = fileInput?.files?.[0];

    if (!file) {
      setStatus('Please choose a file to upload.');
      setUploading(false);
      return;
    }

    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus(json.error || 'Upload failed');
      } else {
        setStatus('Logo uploaded successfully.');
        // Bust cache by appending timestamp
        const img = document.getElementById('logo-preview') as HTMLImageElement | null;
        if (img) {
          const base = '/logo.svg';
          img.src = `${base}?t=${Date.now()}`;
        }
      }
    } catch (err: any) {
      setStatus(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <button onClick={() => router.back()} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>Back</button>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Upload App Logo</h1>
      </div>

      <p style={{ color: '#555', marginBottom: 16 }}>Upload an SVG logo. It will be saved to <code>/public/logo.svg</code> and used across the app.</p>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
        <input name="file" type="file" accept="image/svg+xml" />
        <button type="submit" disabled={isUploading} style={{ padding: '10px 14px', fontWeight: 700, borderRadius: 8, border: '1px solid #1d4ed8', background: '#1d4ed8', color: '#fff' }}>
          {isUploading ? 'Uploading' : 'Upload'}
        </button>
        {status && <p style={{ color: status.includes('success') ? '#0f766e' : '#b91c1c' }}>{status}</p>}
      </form>

      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Preview</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img id="logo-preview" src="/logo.svg" alt="Logo preview" style={{ height: 48 }} onError={(e:any)=>{e.currentTarget.style.display='none'}} />
          <span style={{ color: '#555' }}>If nothing shows, ensure your file is an SVG.</span>
        </div>
      </div>
    </main>
  );
}

