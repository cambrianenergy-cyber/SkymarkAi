import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { db } from '@/lib/firebase';

// POST /api/onboarding/evaluate
export async function POST(request: Request) {
  try {
    const { userId, workspaceId, onboarding } = await request.json();
    if (!userId || !workspaceId || !onboarding) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Load onboarding steps config
    const stepsPath = path.join(process.cwd(), 'config', 'onboarding_steps', 'steps.json');
    const stepsRaw = await fs.readFile(stepsPath, 'utf-8');
    const stepsConfig = JSON.parse(stepsRaw);

    // Evaluate each step (stub logic, expand as needed)
    const evaluatedSteps = {};
    for (const step of stepsConfig) {
      // Example: just mark as todo for now
      evaluatedSteps[step.stepId] = {
        status: 'todo',
        verified: false,
        verifiedAt: null,
        meta: {}
      };
    }

    // Compose new onboarding state
    const now = new Date();
    const newState = {
      version: 1,
      completed: false,
      completedAt: null,
      lastEvaluatedAt: now,
      steps: evaluatedSteps
    };

    // Write to Firestore
    const newDocRef = db()
      .collection('workspaces')
      .doc(workspaceId)
      .collection('members')
      .doc(userId)
      .collection('onboarding')
      .doc('state');
    await newDocRef.set(newState);

    return NextResponse.json({ success: true, state: newState });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to evaluate onboarding' }, { status: 500 });
  }
}
