import { NextResponse } from "next/server";

const SHIPMONDO_ENDPOINT = "https://sandbox.shipmondo.com/api/public/v3/shipments";

export async function POST(req) {
  try {
    const shipmentData = await req.json();

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
