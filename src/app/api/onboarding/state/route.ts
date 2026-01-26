import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { OnboardingStateSchema } from '@/lib/firestoreTypes';

// GET /api/onboarding/state?userId=...&workspaceId=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const workspaceId = searchParams.get('workspaceId');
  if (!userId || !workspaceId) {
    return NextResponse.json({ error: 'Missing userId or workspaceId' }, { status: 400 });
  }
  try {
    const docRef = db().collection('onboarding_states').doc(userId);
    const snap = await docRef.get();
    if (!snap.exists) {
      // Default state if not found
      return NextResponse.json({ state: 'profile' });
    }
    const data = snap.data();
    const parsed = OnboardingStateSchema.safeParse({ ...data, userId, workspaceId });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid onboarding state' }, { status: 500 });
    }
    return NextResponse.json({ state: parsed.data.state });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch onboarding state' }, { status: 500 });
  }
}

// POST /api/onboarding/state
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, workspaceId, state } = body;
    if (!userId || !workspaceId || !state) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const onboardingState = {
      userId,
      workspaceId,
      state,
      updatedAt: new Date().toISOString(),
    };
    OnboardingStateSchema.parse(onboardingState);
    await db().collection('onboarding_states').doc(userId).set(onboardingState);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update onboarding state' }, { status: 500 });
  }
}
