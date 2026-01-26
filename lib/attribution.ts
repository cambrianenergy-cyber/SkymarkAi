// Revenue Attribution Engine
// Tracks touchpoints from lead  outcome  revenue

import { db } from './firebase';
import { addDoc, collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';

interface Touchpoint {
  timestamp: Date;
  type: 'campaign' | 'workflow' | 'post' | 'message' | 'followup';
  entityId: string;
  entityName: string;
  impact: 'high' | 'medium' | 'low';
}

export async function trackTouchpoint(workspaceId: string, leadId: string, touchpoint: {
  type: Touchpoint['type'];
  entityId: string;
  entityName: string;
  impact?: 'high' | 'medium' | 'low';
}) {
  try {
    // Find or create attribution record
    const q = query(
      collection(db, 'attributions'),
      where('workspaceId', '==', workspaceId),
      where('leadId', '==', leadId)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      // Create new attribution
      await addDoc(collection(db, 'attributions'), {
        workspaceId,
        leadId,
        touchpoints: [{
          timestamp: new Date(),
          ...touchpoint,
          impact: touchpoint.impact || 'medium',
        }],
        createdAt: serverTimestamp(),
      });
    } else {
      // Append touchpoint
      const attrRef = doc(db, 'attributions', snap.docs[0].id);
      const existing = snap.docs[0].data();
      await updateDoc(attrRef, {
        touchpoints: [
          ...(existing.touchpoints || []),
          {
            timestamp: new Date(),
            ...touchpoint,
            impact: touchpoint.impact || 'medium',
          },
        ],
        updatedAt: serverTimestamp(),
      });
    }
  } catch (e) {
    console.error('Failed to track touchpoint:', e);
  }
}

export async function recordOutcome(workspaceId: string, leadId: string, outcome: {
  type: 'call_booked' | 'deal_closed' | 'revenue_generated';
  value?: number;
}) {
  try {
    const q = query(
      collection(db, 'attributions'),
      where('workspaceId', '==', workspaceId),
      where('leadId', '==', leadId)
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
      const attrRef = doc(db, 'attributions', snap.docs[0].id);
      await updateDoc(attrRef, {
        outcome: {
          ...outcome,
          timestamp: new Date(),
        },
        updatedAt: serverTimestamp(),
      });
    } else {
      // Create attribution with outcome only
      await addDoc(collection(db, 'attributions'), {
        workspaceId,
        leadId,
        touchpoints: [],
        outcome: {
          ...outcome,
          timestamp: new Date(),
        },
        createdAt: serverTimestamp(),
      });
    }
  } catch (e) {
    console.error('Failed to record outcome:', e);
  }
}

export async function getAttributionReport(workspaceId: string, dateRange: { start: Date; end: Date }) {
  try {
    const q = query(
      collection(db, 'attributions'),
      where('workspaceId', '==', workspaceId)
    );
    const snap = await getDocs(q);

    const attributions = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Filter by date range
    const filtered = attributions.filter((a: any) => {
      if (!a.outcome) return false;
      const outcomeDate = a.outcome.timestamp?.toDate ? a.outcome.timestamp.toDate() : new Date(a.outcome.timestamp);
      return outcomeDate >= dateRange.start && outcomeDate <= dateRange.end;
    });

    // Aggregate by entity
    const entityImpact: Record<string, { name: string; touchpoints: number; outcomes: number; revenue: number }> = {};

    filtered.forEach((attr: any) => {
      attr.touchpoints?.forEach((tp: any) => {
        if (!entityImpact[tp.entityId]) {
          entityImpact[tp.entityId] = { name: tp.entityName, touchpoints: 0, outcomes: 0, revenue: 0 };
        }
        entityImpact[tp.entityId].touchpoints += 1;
      });

      if (attr.outcome) {
        // Distribute credit across all touchpoints
        attr.touchpoints?.forEach((tp: any) => {
          if (entityImpact[tp.entityId]) {
            entityImpact[tp.entityId].outcomes += 1 / (attr.touchpoints.length || 1);
            entityImpact[tp.entityId].revenue += (attr.outcome.value || 0) / (attr.touchpoints.length || 1);
          }
        });
      }
    });

    const summary = {
      totalOutcomes: filtered.filter((a: any) => a.outcome).length,
      totalRevenue: filtered.reduce((sum: number, a: any) => sum + (a.outcome?.value || 0), 0),
      topEntities: Object.entries(entityImpact)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10),
    };

    return summary;
  } catch (e) {
    console.error('Failed to get attribution report:', e);
    return null;
  }
}

