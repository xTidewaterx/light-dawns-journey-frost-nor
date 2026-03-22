"use client";

import { useState, useRef } from "react";

// Helper function to map country names to country codes
function getCountryCode(countryInput) {
  if (!countryInput) return "DK";
  
  const input = countryInput.toString().toUpperCase().trim();
  
  // If it's already a 2-letter code, return it
  if (/^[A-Z]{2}$/.test(input)) {
    return input;
  }

  // Map country names to codes
  const countryMap = {
    'DENMARK': 'DK',
    'DANMARK': 'DK',
    'DENMARK (KINGDOM OF)': 'DK',
    'NORWAY': 'NO',
    'NORGE': 'NO',
    'NORWAY (KINGDOM OF)': 'NO',
    'SWEDEN': 'SE',
    'SVERIGE': 'SE',
    'GERMANY': 'DE',
    'DEUTSCHLAND': 'DE',
    'NETHERLANDS': 'NL',
    'HOLLAND': 'NL',
  };

  return countryMap[input] || "DK";
}

export default function ServicePointRequest({ onServicePointSelected }) {
  const [addressQuery, setAddressQuery] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingServicePoints, setLoadingServicePoints] = useState(false);
  const [servicePoints, setServicePoints] = useState([]);
  const [error, setError] = useState(null);
  const [selectedServicePoint, setSelectedServicePoint] = useState(null);
  const typingTimeout = useRef(null);

  const [addressData, setAddressData] = useState({
    street: "",
    streetNumber: "",
    district: "",
    city: "",
    postcode: "",
    country: "DK",
  });

  // Fetch address suggestions from OpenStreetMap
  async function fetchAddressSuggestions(q) {
    if (q.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    try {
      const res = await fetch(`/api/address?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setAddressSuggestions(data.slice(0, 5));
      } else {
        setAddressSuggestions([]);
      }
    } catch {
      setAddressSuggestions([]);
    }
  }

  function handleAddressInputChange(e) {
    const value = e.target.value;
    setAddressQuery(value);
    
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => fetchAddressSuggestions(value), 1200);
  }

  function handleSelectAddress(suggestion) {
    setAddressQuery(suggestion.display_name);
    setAddressSuggestions([]);

    if (suggestion.address) {
      // Extract postcode from address object - try multiple field names
      const postcode = suggestion.address.postcode || 
                      suggestion.address.postal_code || 
                      suggestion.address.zipcode || 
                      "";

      // Get proper country code
      const countryCode = getCountryCode(
        suggestion.address.country_code || suggestion.address.country || "DK"
      );

      setAddressData({
        street: suggestion.address.road || suggestion.address.name || "",
        streetNumber: suggestion.address.house_number || "",
        district: suggestion.address.suburb || suggestion.address.neighbourhood || suggestion.address.hamlet || "",
        city: suggestion.address.city || suggestion.address.town || suggestion.address.village || "",
        postcode: postcode,
        country: countryCode,
      });
    } else {
      // Fallback: parse from display_name - it usually contains postcode in parentheses or as part of the string
      let postcode = "";
      
      // Try to extract postcode from display_name (usually in format like "City XXXXX")
      const postcodeMatch = suggestion.display_name.match(/\b(\d{4,5})\b/);
      if (postcodeMatch) {
        postcode = postcodeMatch[1];
      }

      const parts = suggestion.display_name.split(",").map(p => p.trim());
      const countryCode = getCountryCode(parts[parts.length - 1] || "DK");

      setAddressData({
        streetNumber: parts[0] || "",
        street: parts[1] || "",
        district: parts[2] || "",
        city: parts[3] || parts[4] || "",
        postcode: postcode,
        country: countryCode,
      });
    }
  }

  async function fetchServicePoints() {
    if (!addressData.postcode) {
      setError("Please enter a postcode");
      return;
    }

    setLoadingServicePoints(true);
    setError(null);
    setServicePoints([]);

    try {
      const response = await fetch("/api/shipmondo/service-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postcode: addressData.postcode,
          country_code: addressData.country || "DK",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to fetch service points");
        setServicePoints([]);
        return;
      }

      setServicePoints(data.options || []);
    } catch (err) {
      setError("Failed to fetch service points");
      console.error(err);
    } finally {
      setLoadingServicePoints(false);
    }
  }

  function handleSelectServicePoint(sp) {
    setSelectedServicePoint(sp);
    if (typeof onServicePointSelected === "function") {
      onServicePointSelected({
        servicePoint: sp,
        address: addressData,
      });
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "12px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "14px",
    boxSizing: "border-box",
    marginBottom: "8px",
  };

  const buttonStyle = {
    padding: "12px 16px",
    background: "#0070f3",
    color: "white",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    width: "100%",
    marginBottom: "16px",
  };

  const suggestionStyle = {
    padding: "12px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    marginBottom: "8px",
    cursor: "pointer",
    background: "#f9f9f9",
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "20px", color: "#0070f3" }}>
        Find Your Pickup Point
      </h2>

      {/* Address Input Section */}
      <div style={{ marginBottom: "20px", padding: "16px", background: "#f5f5f5", borderRadius: "8px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "12px" }}>1. Enter Your Address</h3>
        
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Address Search</label>
        <input
          type="text"
          value={addressQuery}
          onChange={handleAddressInputChange}
          placeholder="e.g., Farimagsgade 1, Copenhagen or 8000 Aarhus"
          style={inputStyle}
        />

        {/* Address Suggestions */}
        {addressSuggestions.length > 0 && (
          <div style={{ marginBottom: "12px" }}>
            <p style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>Select from suggestions:</p>
            {addressSuggestions.map((s) => (
              <div
                key={s.place_id}
                onClick={() => handleSelectAddress(s)}
                style={{
                  ...suggestionStyle,
                  background: "#e8f4f8",
                  borderColor: "#0070f3",
                }}
              >
                {s.display_name}
              </div>
            ))}
          </div>
        )}

        {/* Address Fields */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: "500" }}>Street</label>
            <input
              type="text"
              value={addressData.street}
              onChange={(e) => setAddressData({ ...addressData, street: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: "500" }}>House Number</label>
            <input
              type="text"
              value={addressData.streetNumber}
              onChange={(e) => setAddressData({ ...addressData, streetNumber: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: "500" }}>City</label>
            <input
              type="text"
              value={addressData.city}
              onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: "500" }}>Postcode</label>
            <input
              type="text"
              value={addressData.postcode}
              onChange={(e) => setAddressData({ ...addressData, postcode: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: "500" }}>District</label>
            <input
              type="text"
              value={addressData.district}
              onChange={(e) => setAddressData({ ...addressData, district: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: "500" }}>Country</label>
            <select
              value={addressData.country}
              onChange={(e) => setAddressData({ ...addressData, country: e.target.value })}
              style={inputStyle}
            >
              <option value="DK">Denmark (DK)</option>
              <option value="NO">Norway (NO)</option>
              <option value="SE">Sweden (SE)</option>
              <option value="DE">Germany (DE)</option>
              <option value="NL">Netherlands (NL)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pickup Points Section */}
      <div style={{ marginBottom: "20px", padding: "16px", background: "#f5f5f5", borderRadius: "8px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "12px" }}>2. Find Pickup Points</h3>
        
        <button
          onClick={fetchServicePoints}
          disabled={loadingServicePoints}
          style={{
            ...buttonStyle,
            background: loadingServicePoints ? "#ccc" : "#0070f3",
            cursor: loadingServicePoints ? "not-allowed" : "pointer",
          }}
        >
          {loadingServicePoints ? "Loading Pickup Points..." : `Find Pickup Points in ${addressData.country}`}
        </button>

        {error && (
          <div style={{ padding: "12px", background: "#fee", color: "#c33", borderRadius: "6px", marginBottom: "12px" }}>
            {error}
          </div>
        )}

        {servicePoints.length > 0 && (
          <div>
            <p style={{ fontSize: "14px", fontWeight: "500", marginBottom: "12px", color: "#333" }}>
              Available Pickup Points ({servicePoints.length})
            </p>
            <div
              style={{
                maxHeight: "400px",
                overflowY: "auto",
                border: "1px solid #ddd",
                borderRadius: "6px",
                padding: "8px",
                background: "#fff",
              }}
            >
              {servicePoints.map((sp) => (
                <div
                  key={sp.id}
                  onClick={() => handleSelectServicePoint(sp)}
                  style={{
                    padding: "12px",
                    border: selectedServicePoint?.id === sp.id ? "2px solid #0070f3" : "1px solid #ddd",
                    borderRadius: "6px",
                    marginBottom: "8px",
                    cursor: "pointer",
                    background: selectedServicePoint?.id === sp.id ? "#e8f4f8" : "#fff",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{sp.name}</div>
                  <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>
                    {sp.address}
                  </div>
                  <div style={{ fontSize: "13px", color: "#888", marginBottom: "6px" }}>
                    {sp.postcode} {sp.city}
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "bold", color: "#0070f3" }}>
                    Shipping Cost: {(sp.cost / 100).toFixed(2)} NOK
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loadingServicePoints && servicePoints.length === 0 && addressData.postcode && !error && (
          <p style={{ fontSize: "14px", color: "#666", textAlign: "center", padding: "20px 0" }}>
            No pickup points found. Try a different postcode.
          </p>
        )}
      </div>

      {/* Selected Pickup Point Summary */}
      {selectedServicePoint && (
        <div style={{ padding: "16px", background: "#e8f4f8", border: "2px solid #0070f3", borderRadius: "8px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "12px", color: "#0070f3" }}>✓ Selected Pickup Point</h3>
          <div style={{ fontSize: "14px" }}>
            <p style={{ margin: "6px 0", fontWeight: "bold" }}>{selectedServicePoint.name}</p>
            <p style={{ margin: "6px 0", color: "#555" }}>
              {selectedServicePoint.address}, {selectedServicePoint.postcode} {selectedServicePoint.city}
            </p>
            <p style={{ margin: "6px 0" }}>
              Shipping Cost: <strong>{(selectedServicePoint.cost / 100).toFixed(2)} NOK</strong>
            </p>
            <p style={{ margin: "6px 0", fontSize: "13px", color: "#777" }}>Delivery Address: {addressData.street} {addressData.streetNumber}, {addressData.postcode} {addressData.city}, {addressData.country}</p>
          </div>
        </div>
      )}
    </div>
  );
}