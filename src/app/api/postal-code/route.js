// Free postal code lookup API using OpenStreetMap Nominatim
// Completely free, no authentication needed
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const postalCode = searchParams.get("code");
  const countryCode = searchParams.get("country") || "DK";

  if (!postalCode) {
    return new Response(
      JSON.stringify({ error: "Postal code is required" }),
      { status: 400 }
    );
  }

  // Validate postal code format for specific countries
  if (countryCode === "DK" && !/^\d{4}$/.test(postalCode.trim())) {
    return new Response(
      JSON.stringify({
        error: "Invalid Danish postal code format (must be 4 digits)",
        postalCode,
        country: countryCode,
      }),
      { status: 400 }
    );
  }

  try {
    // Using OpenStreetMap Nominatim - completely free, no auth needed
    const countryName = getCountryName(countryCode);
    
    // Try searching by postal code + country name (often works better than postalcode param)
    const searchQuery = `${postalCode.trim()} ${countryName}`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`;
    
    console.log("Nominatim postal code lookup:", countryCode, postalCode, "Query:", searchQuery);
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'NORYA-App/1.0'
      }
    });
    
    if (!res.ok) {
      console.error("Nominatim API error:", res.status, res.statusText);
      const errorText = await res.text();
      console.error("Response body:", errorText);
      return new Response(
        JSON.stringify({
          error: "Nominatim API error",
          status: res.status,
          details: errorText.slice(0, 200)
        }),
        { status: 502 }
      );
    }
    
    const data = await res.json();
    console.log("Nominatim response:", data);
    
    if (!data || data.length === 0) {
      console.warn("No results found for postal code:", postalCode, countryCode);
      return new Response(
        JSON.stringify({
          error: "Postal code not found",
          postalCode,
          country: countryCode,
        }),
        { status: 404 }
      );
    }

    const result = data[0];
    const address = result.address || {};
    
    // Extract city name from address - try multiple fields for international support
    const city = address.city || 
                address.town || 
                address.village || 
                address.county || 
                address.municipality ||
                "Unknown";
    
    const response = {
      success: true,
      postalCode: postalCode,
      city: city,
      district: address.county || address.municipality || city,
      country: countryCode,
      displayName: result.display_name,
    };
    
    console.log("✅ Postal code lookup successful:", response);
    
    return new Response(
      JSON.stringify(response),
      { status: 200 }
    );
  } catch (err) {
    console.error("Postal code API error:", err);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch postal code information",
        details: err.message,
      }),
      { status: 500 }
    );
  }
}

function getCountryName(code) {
  const countryMap = {
    'NO': 'Norway',
    'SE': 'Sweden',
    'DK': 'Denmark',
    'FI': 'Finland',
    'DE': 'Germany',
    'NL': 'Netherlands',
  };
  return countryMap[code.toUpperCase()] || code;
}
