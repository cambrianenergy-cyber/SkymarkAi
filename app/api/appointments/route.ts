import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { adminDb } from "@lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      preferredDate,
      preferredTime,
      notes,
      campaign,
      workspaceId,
      adPlatform,
      adId,
      utmSource,
      utmCampaign,
    } = body || {};

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    await adminDb.collection("appointments").add({
      name,
      email,
      phone: phone || "",
      preferredDate: preferredDate || "",
      preferredTime: preferredTime || "",
      notes: notes || "",
      campaign: campaign || "",
      workspaceId: workspaceId || "",
      adPlatform: adPlatform || "",
      adId: adId || "",
      utmSource: utmSource || "",
      utmCampaign: utmCampaign || "",
      status: "new",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Appointment create error", error);
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
  }
}
