export async function GET(request) {
  const { searchParams } = new URL(request.url);
  let query = searchParams.get("q");

  if (!query) {
    return new Response(JSON.stringify([]), { status: 200 });
  }

  try {
    // Determine which Scandinavian country to search
    let countryCodes = "dk,no,se,fi"; // Default: search all Nordic countries
    const lowerQuery = query.toLowerCase();
    
    // If user specifically mentioned a country, narrow down the search
    if (lowerQuery.includes("norway") || lowerQuery.includes("norge")) {
      countryCodes = "no";
    } else if (lowerQuery.includes("sweden") || lowerQuery.includes("sverige")) {
      countryCodes = "se";
    } else if (lowerQuery.includes("finland") || lowerQuery.includes("suomi")) {
      countryCodes = "fi";
    } else if (lowerQuery.includes("denmark") || lowerQuery.includes("danmark")) {
      countryCodes = "dk";
    }
    
    // Use countrycodes filter for more accurate results
    // denmark=DK, norway=NO, sweden=SE, finland=FI
    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
    
    // Add address details and increase limit for better results
    url += `&addressdetails=1&limit=8&countrycodes=${countryCodes}`;

    console.log("Address search URL:", url);
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'NORYA-App (https://norya.no)',
      },
    });

    // Check if response is ok before parsing JSON
    if (!res.ok) {
      const text = await res.text();
      console.error(`Nominatim API error (${res.status}):`, text.substring(0, 200));
      return new Response(JSON.stringify({ error: `API returned ${res.status}` }), { status: 500 });
    }

    // Check if response is JSON before parsing
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error("Nominatim returned non-JSON response:", text.substring(0, 200));
      return new Response(JSON.stringify({ error: "Invalid response format" }), { status: 500 });
    }

    const data = await res.json();
    
    // Filter and sort results to prioritize addresses with postal codes and full information
    const enhancedData = (Array.isArray(data) ? data : []).map(item => {
      const hasPostalCode = item.address?.postcode ? 1 : 0;
      const isAddress = item.address ? 1 : 0;
      // Prioritize items with more complete information
      item._priority = hasPostalCode * 2 + isAddress;
      return item;
    }).sort((a, b) => b._priority - a._priority);
    
    return new Response(JSON.stringify(enhancedData), { status: 200 });
  } catch (err) {
    console.error("Address API error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
