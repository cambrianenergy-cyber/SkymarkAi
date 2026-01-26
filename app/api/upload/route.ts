import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Only accept SVG to keep branding consistent
    if (!(file.type || '').includes('svg')) {
      return NextResponse.json({ error: 'Only SVG files are supported. Please upload an .svg' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const dest = path.join(process.cwd(), 'public', 'logo.svg');
    await writeFile(dest, buffer);

    return NextResponse.json({ ok: true, path: '/logo.svg' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Upload failed' }, { status: 500 });
  }
}
