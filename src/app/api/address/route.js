export async function GET(request) {
  const { searchParams } = new URL(request.url);
  let query = searchParams.get("q");

  if (!query) {
    return new Response(JSON.stringify([]), { status: 200 });
  }

  try {
    // If user is searching for a Danish address without specifying country, 
    // prioritize Denmark to get better results
    const isDanishSearch = !query.toLowerCase().includes("norway") && 
                          !query.toLowerCase().includes("norge") &&
                          !query.toLowerCase().includes("sweden") &&
                          !query.toLowerCase().includes("sverige") &&
                          !query.toLowerCase().includes("finland");
    
    // Use countrycodes filter for more accurate results
    // denmark=DK, norway=NO, sweden=SE, finland=FI
    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
    
    // If it looks like a Danish search (default), add country filter to prioritize Denmark results
    if (isDanishSearch && !query.toLowerCase().includes('denmark') && !query.toLowerCase().includes('danmark')) {
      url += `&countrycodes=dk`;
    }

    console.log("Address search URL:", url);
    
    const res = await fetch(url);
    const data = await res.json();
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    console.error("Address API error:", err);
    return new Response(JSON.stringify({ error: "Failed to fetch" }), { status: 500 });
  }
}
