import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url);

    // Read from URL params instead of hardcoding
    const country_code = searchParams.get("country_code") || null;
    const product_code = searchParams.get("product_code") || null;

    const { postal_code } = await req.json();

    if (!postal_code) {
      return NextResponse.json(
        { error: "Missing postal_code in request body." },
        { status: 400 }
      );
    }

    if (!country_code || !product_code) {
      return NextResponse.json(
        {
          error:
            "Missing required URL params: country_code and product_code must be provided.",
        },
        { status: 400 }
      );
    }

    // Reuse SAME credentials as shipment route
    const user = process.env.SHIPMONDO_SANDBOX_USER;
    const key = process.env.SHIPMONDO_SANDBOX_KEY;

    if (!user || !key) {
      return NextResponse.json(
        {
          error:
            "Missing Shipmondo sandbox credentials (SHIPMONDO_SANDBOX_USER / SHIPMONDO_SANDBOX_KEY).",
        },
        { status: 500 }
      );
    }

    const credentials = Buffer.from(`${user}:${key}`).toString("base64");

    // Build URL dynamically
    const url =
      `https://sandbox.shipmondo.com/api/public/v3/service_point/service_points` +
      `?country_code=${encodeURIComponent(country_code)}` +
      `&product_code=${encodeURIComponent(product_code)}` +
      `&zipcode=${encodeURIComponent(postal_code.trim())}` +
      `&quantity=20`;

    console.log("🔵 Shipmondo Service Points URL:", url);
    console.log("🔵 Using credentials user:", user, "(key hidden)");
    console.log("🔵 Product code used:", product_code);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    const status = response.status;
    console.log("🟡 Shipmondo response status:", status);

    let json = null;
    let text = null;

    try {
      json = await response.json();
      console.log("🟢 Parsed JSON response:", json);
    } catch (e) {
      text = await response.text();
      console.error("Response was not JSON:", text?.slice(0, 400));
    }

    if (!response.ok) {
      console.error("❌ Shipmondo error response:", json || text);
      return NextResponse.json(
        {
          success: false,
          error: "Shipmondo API request failed",
          status,
          details: json || text || "No response body",
          requested_url: url,
        },
        { status: response.status }
      );
    }

    const servicePoints = Array.isArray(json)
      ? json
      : json?.service_points || [];

    return NextResponse.json({
      success: true,
      requested: {
        zipcode: postal_code.trim(),
        country_code,
        product_code,
      },
      service_points: servicePoints,
      count: servicePoints.length,
      note:
        servicePoints.length === 0
          ? "No points returned – try another zip (e.g. 2300, 1050) or confirm product_code in sandbox"
          : undefined,
    });
  } catch (error) {
    console.error("💥 Error fetching service points:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch service points",
        details: error.message,
      },
      { status: 500 }
    );
  }
}