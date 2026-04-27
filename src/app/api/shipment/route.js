import { NextResponse } from "next/server";
import { authAdmin, db } from "../../lib/firebaseAdmin";

const SHIPMONDO_ENDPOINT = "https://sandbox.shipmondo.com/api/public/v3/shipments";

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 8;
const rateLimitStore = new Map();

function getClientIp(req) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (!forwarded) return "unknown";
  return forwarded.split(",")[0]?.trim() || "unknown";
}

function isRateLimited(key) {
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || now - existing.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return false;
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);

  return existing.count > RATE_LIMIT_MAX_REQUESTS;
}

async function verifyShipmentCaller(req, shipmentData) {
  const internalSecret = process.env.SHIPMENT_INTERNAL_SECRET;
  const internalHeader = req.headers.get("x-internal-shipment-secret");

  if (internalSecret && internalHeader && internalHeader === internalSecret) {
    return { mode: "internal", uid: "internal" };
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const decoded = await authAdmin.verifyIdToken(authHeader.slice(7));
    const userDoc = await db.collection("users").doc(decoded.uid).get();
    const role = userDoc.exists ? userDoc.data()?.role : null;

    if (role === "admin") {
      return { mode: "admin", uid: decoded.uid, email: decoded.email || "" };
    }

    const receiver = Array.isArray(shipmentData?.parties)
      ? shipmentData.parties.find((p) => p?.type === "receiver")
      : null;

    const receiverEmail = (receiver?.email || "").toString().trim().toLowerCase();
    const callerEmail = (decoded.email || "").toString().trim().toLowerCase();

    if (receiverEmail && callerEmail && receiverEmail === callerEmail) {
      return { mode: "owner", uid: decoded.uid, email: callerEmail };
    }

    return null;
  } catch {
    return null;
  }
}

export async function POST(req) {
  try {
    const shipmentData = await req.json();

    const caller = await verifyShipmentCaller(req, shipmentData);
    if (!caller) {
      return NextResponse.json(
        { error: "Unauthorized. Provide valid token and be admin or shipment owner." },
        { status: 401 }
      );
    }

    const rateLimitKey = `${caller.uid || "anon"}:${getClientIp(req)}`;
    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json(
        { error: "Too many shipment requests. Please wait and try again." },
        { status: 429 }
      );
    }

    // ✅ Validate parties
    if (
      !Array.isArray(shipmentData.parties) ||
      !shipmentData.parties.find(p => p.type === "sender") ||
      !shipmentData.parties.find(p => p.type === "receiver")
    ) {
      return NextResponse.json(
        { error: "Invalid request: 'parties' array must include sender and receiver." },
        { status: 400 }
      );
    }

    const user = process.env.SHIPMONDO_SANDBOX_USER;
    const key = process.env.SHIPMONDO_SANDBOX_KEY;

    if (!user || !key) {
      return NextResponse.json(
        { error: "Missing Shipmondo sandbox credentials." },
        { status: 500 }
      );
    }

    const credentials = Buffer.from(`${user}:${key}`).toString("base64");

    // ✅ Hardcode service_codes to a sandbox-valid value for GLSDK_HD
    const payload = {
      ...shipmentData,
      test_mode: true,
      own_agreement: false,
      product_code: "GLSDK_HD",
      product_id: "GLSDK_HD",
      service_codes: "SMS_NT,EMAIL_NT", // ✅ required notification service for this sandbox product
    };

    // Log outgoing payload and each party's country/postal fields for diagnostics
    try {
      console.log("Outgoing Shipmondo payload:", JSON.stringify(payload, null, 2));
    } catch (e) {
      console.log("Outgoing Shipmondo payload (non-serializable):", payload);
    }

    if (Array.isArray(payload.parties)) {
      payload.parties.forEach((p, idx) => {
        try {
          console.log(`Party[${idx}] type=${p.type} country_code=${p.country_code} country=${p.country} postal_code=${p.postal_code}`);
        } catch (e) {
          console.log(`Party[${idx}]`, p);
        }
      });
    }

    // ✅ Send shipment creation request
    const response = await fetch(SHIPMONDO_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    let data;
    try {
      data = await response.json();
    } catch (jsonErr) {
      const text = await response.text();
      console.error("❌ Shipmondo returned non-JSON response:", text);
      return NextResponse.json(
        { error: "Shipmondo returned invalid JSON.", body: text.slice(0, 300) },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error("❌ Shipmondo API error:", data);
      return NextResponse.json({ error: data }, { status: response.status });
    }

    //where does data come from, it comes from the response.json() above
    console.log("✅ Shipment created successfully:", data);
   
    return NextResponse.json({ success: true, shipment: data });

  } catch (error) {
    console.error("💥 Fatal error in /api/shipment route:", error);
    return NextResponse.json(
      { error: "Server error creating shipment." },
      { status: 500 }
    );
  }
}
