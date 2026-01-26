import { db } from '../firebase';
import type { Subscription } from '../firestoreTypes';
import { SubscriptionSchema } from '../firestoreTypes';

export async function getSubscription(subscriptionId: string): Promise<Subscription | null> {
  const doc = await db().collection('subscriptions').doc(subscriptionId).get();
  if (!doc.exists) return null;
  const data = doc.data();
  const parsed = SubscriptionSchema.safeParse({ ...data, subscriptionId });
  return parsed.success ? parsed.data : null;
}

export async function setSubscription(subscription: Subscription): Promise<void> {
  SubscriptionSchema.parse(subscription);
  await db().collection('subscriptions').doc(subscription.subscriptionId).set(subscription);
}
