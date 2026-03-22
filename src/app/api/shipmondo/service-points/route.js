import { NextResponse } from "next/server";

const SERVICE_POINTS_ENDPOINT = "https://sandbox.shipmondo.com/api/public/v3/service_point/service_points";

export async function POST(req) {
  try {
    const body = await req.json();
    const { postcode, country_code = "NO" } = body || {};

    if (!postcode) {
      return NextResponse.json({ error: "Missing postcode" }, { status: 400 });
    }

    const user = process.env.SHIPMONDO_SANDBOX_USER;
    const key = process.env.SHIPMONDO_SANDBOX_KEY;

    if (!user || !key) {
      return NextResponse.json({ error: "Missing Shipmondo credentials" }, { status: 500 });
    }

    const credentials = Buffer.from(`${user}:${key}`).toString("base64");

    // Determine product code based on country
    const productCodeMap = {
      'DK': 'GLSDK_SD',
      'NO': 'GLSDK_HD',
      'SE': 'GLSDE_B',
      'DE': 'GLSDE_B',
      'NL': 'GLSNL_B',
    };
    const productCode = productCodeMap[country_code] || 'GLSDK_SD';

    // Build URL with required query parameters for Shipmondo API
    const url = `${SERVICE_POINTS_ENDPOINT}?country_code=${encodeURIComponent(country_code)}&product_code=${encodeURIComponent(productCode)}&zipcode=${encodeURIComponent(postcode.trim())}&quantity=20`;

    console.log("Calling Shipmondo URL:", url);

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
      },
    });

    // If non-OK, capture body text for diagnostics
    if (!res.ok) {
      const txt = await res.text();
      console.error("Shipmondo service-points error:", res.status, txt.slice(0, 200));
      return NextResponse.json({ error: "Shipmondo error", status: res.status, body: txt.slice(0, 200) }, { status: res.status });
    }

    // Try to parse JSON, but handle HTML or other non-JSON responses gracefully
    let data;
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const txt = await res.text();
      console.error("Shipmondo returned non-JSON response (content-type:", contentType, "):", txt.slice(0, 400));
      return NextResponse.json({ error: "Shipmondo returned non-JSON response", contentType, body: txt.slice(0, 400) }, { status: 502 });
    }

    try {
      data = await res.json();
    } catch (err) {
      const txt = await res.text();
      console.error("Failed to parse Shipmondo JSON response:", err.message, txt.slice(0, 400));
      return NextResponse.json({ error: "Invalid JSON from Shipmondo", body: txt.slice(0, 400) }, { status: 502 });
    }

    console.log("Shipmondo raw response (first item):", JSON.stringify(Array.isArray(data) ? data[0] : data[0] || {}, null, 2));

    // Normalize into simple list of options
    const options = (Array.isArray(data) ? data : data.service_points || []).map((sp) => ({
      id: sp.id || sp.service_point_id || `${sp.company || sp.name}`,
      name: sp.name || sp.company || `${sp.address1 || ""} ${sp.postal_code || ""}`,
      address: sp.address1 || sp.address || "",
      postcode: sp.postal_code || postcode,
      city: sp.city || "",
      country_code: sp.country_code || country_code,
      // Shipmondo public API doesn't always return a price; use fallback mapping
      cost: sp.price ? Math.round(sp.price * 100) : (sp.type === "parcel" ? 9900 : 7900),
      raw: sp,
    }));

    return NextResponse.json({ options });
  } catch (err) {
    console.error("Error in /api/shipmondo/service-points:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
