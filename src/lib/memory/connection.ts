import { db } from '../firebase';
import type { Connection } from '../firestoreTypes';
import { ConnectionSchema } from '../firestoreTypes';

export async function getConnection(connectionId: string): Promise<Connection | null> {
  const doc = await db().collection('connections').doc(connectionId).get();
  if (!doc.exists) return null;
  const data = doc.data();
  const parsed = ConnectionSchema.safeParse({ ...data, connectionId });
  return parsed.success ? parsed.data : null;
}

export async function setConnection(connection: Connection): Promise<void> {
  ConnectionSchema.parse(connection);
  await db().collection('connections').doc(connection.connectionId).set(connection);
}
