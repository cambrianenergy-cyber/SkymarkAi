import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';

// New onboarding schema version
const ONBOARDING_VERSION = 1;

function migrateToNewSchema(data: any) {
  // If already in new format, return as is
  if (data && data.version === ONBOARDING_VERSION && data.steps) return data;
  // Migrate old format to new
  const now = new Date();
  let steps: Record<string, any> = {};
  if (Array.isArray(data?.steps)) {
    for (const s of data.steps) {
      steps[s.key || s.stepId || 'unknown'] = {
        status: s.completed ? 'done' : 'todo',
        verified: !!s.completed,
        verifiedAt: s.completed ? (s.completedAt ? new Date(s.completedAt) : now) : null,
        meta: s
      };
    }
  }
  return {
    version: ONBOARDING_VERSION,
    completed: !!data?.completed,
    completedAt: data?.completedAt ? new Date(data.completedAt) : null,
    lastEvaluatedAt: now,
    steps,
  };
}

// GET /api/onboarding/state?userId=...&workspaceId=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const workspaceId = searchParams.get('workspaceId');
  if (!userId || !workspaceId) {
    return NextResponse.json({ error: 'Missing userId or workspaceId' }, { status: 400 });
  }
  try {
    // New canonical path
    const newDocRef = db()
      .collection('workspaces')
      .doc(workspaceId)
      .collection('members')
      .doc(userId)
      .collection('onboarding')
      .doc('state');
    const newSnap = await newDocRef.get();
    if (newSnap.exists) {
      const data = newSnap.data();
      return NextResponse.json({ ...data, userId, workspaceId });
    }
    // Try old path for migration
    const oldDocRef = db().collection('onboarding_states').doc(`${userId}_${workspaceId}`);
    const oldSnap = await oldDocRef.get();
    if (oldSnap.exists) {
      const oldData = oldSnap.data();
      const migrated = migrateToNewSchema(oldData);
      await newDocRef.set(migrated);
      await oldDocRef.delete();
      return NextResponse.json({ ...migrated, userId, workspaceId, migrated: true });
    }
    // Default state if not found
    const now = new Date();
    const defaultState = {
      version: ONBOARDING_VERSION,
      completed: false,
      completedAt: null,
      lastEvaluatedAt: now,
      steps: {},
    };
    await newDocRef.set(defaultState);
    return NextResponse.json({ ...defaultState, userId, workspaceId, initialized: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch onboarding state' }, { status: 500 });
  }
}

// POST /api/onboarding/state
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, workspaceId, onboarding } = body;
    if (!userId || !workspaceId || !onboarding) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    // Validate and fill schema
    const now = new Date();
    const onboardingState = {
      version: ONBOARDING_VERSION,
      completed: !!onboarding.completed,
      completedAt: onboarding.completedAt ? new Date(onboarding.completedAt) : null,
      lastEvaluatedAt: onboarding.lastEvaluatedAt ? new Date(onboarding.lastEvaluatedAt) : now,
      steps: onboarding.steps || {},
    };
    // Write to new canonical path
    const newDocRef = db()
      .collection('workspaces')
      .doc(workspaceId)
      .collection('members')
      .doc(userId)
      .collection('onboarding')
      .doc('state');
    await newDocRef.set(onboardingState);
    // Delete old path if exists
    const oldDocRef = db().collection('onboarding_states').doc(`${userId}_${workspaceId}`);
    const oldSnap = await oldDocRef.get();
    if (oldSnap.exists) {
      await oldDocRef.delete();
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update onboarding state' }, { status: 500 });
  }
}
