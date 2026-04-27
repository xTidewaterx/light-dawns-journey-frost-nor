"use client";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import CreateShipmentButton from "../utils/CreateShipmentButton";

export default function ShippingForm({ onShippingSelected }) {
  const [step, setStep] = useState(1);
  const [userInfo, setUserInfo] = useState({ name: "", email: "" });
  const [emailError, setEmailError] = useState("");
  const [query, setQuery] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [servicePoints, setServicePoints] = useState([]);
  const [loadingServicePoints, setLoadingServicePoints] = useState(false);
  const [serviceError, setServiceError] = useState(null);
  const [selectedServicePoint, setSelectedServicePoint] = useState(null);
  const [createShipmentStatus, setCreateShipmentStatus] = useState(null);
  
  //basically use a button to take all shipping data and send to backend to create a shipment, then return the created shipment details to parent component which can add it to cart as a line item with metadata for fulfillment at checkout
  const [shippingData, setShippingData] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    streetNumber: "",
    district: "",
    city: "",
    postcode: "",
    country: "DK", // Default to Denmark
  });
  const typingTimeout = useRef(null);
  const postalCodeTimeout = useRef(null);
  const shippingDataRef = useRef(shippingData);

  // Convert country names to ISO country codes
  function normalizeCountryCode(countryInput) {
    if (!countryInput) return "DK"; // Default to DK, not NO
    const input = countryInput.toString().trim().toUpperCase();
    
    const countryMap = {
      'DANMARK': 'DK',
      'DENMARK': 'DK',
      'NORGE': 'NO',
      'NORWAY': 'NO',
      'SVERIGE': 'SE',
      'SWEDEN': 'SE',
      'FINLAND': 'FI',
      'SUOMI': 'FI',
      'DK': 'DK',
      'NO': 'NO',
      'SE': 'SE',
      'FI': 'FI',
    };

    return countryMap[input] || input.slice(0, 2).toUpperCase() || "DK"; // Default to DK
  }

  async function fetchSuggestions(q) {
    if (q.length < 3) return setAddressSuggestions([]);
    try {
      // Add Denmark context if user is likely searching for Danish addresses
      let searchQuery = q;
      if (!q.toLowerCase().includes('denmark') && 
          !q.toLowerCase().includes('danmark') &&
          !q.toLowerCase().includes('norge') &&
          !q.toLowerCase().includes('sweden') &&
          !q.toLowerCase().includes('sverige')) {
        // If no country specified, add Denmark to help narrow results
        // This improves accuracy for Danish addresses
        searchQuery = `${q}, Denmark`;
      }
      
      const res = await fetch(`/api/address?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      console.log("Address suggestions received:", data?.length || 0);
      if (Array.isArray(data)) setAddressSuggestions(data.slice(0, 5));
      else setAddressSuggestions([]);
    } catch {
      setAddressSuggestions([]);
    }
  }

  // Fetch postal code information using free Nominatim API
  async function fetchPostalCodeInfo(postalCode, countryCode = "DK") {
    // This function is no longer used - postal code is entered manually
    // Kept for backward compatibility if needed later
    return;
  }

  function handleSelect(s) {
    setQuery(s.display_name);
    setAddressSuggestions([]);
    
    console.log("Selected address suggestion:", s); // Debug log
    
    if (s.address) {
      // Normalize country code from address object
      const countryCode = normalizeCountryCode(s.address.country_code || s.address.country || "DK");
      
      // Extract postcode - try multiple field names
      const postcode = s.address.postcode || 
                      s.address.postal_code || 
                      s.address.zipcode || 
                      "";
      
      console.log("✅ Address object found - country:", countryCode, "postcode:", postcode);
      
      setShippingData(prev => ({
        ...prev,
        street: s.address.road || s.address.name || "",
        streetNumber: s.address.house_number || "",
        district: s.address.suburb || s.address.neighbourhood || s.address.hamlet || "",
        city: s.address.city || s.address.town || s.address.village || "",
        postcode: postcode,
        country: countryCode,
      }));
      
      // If we got a postcode from address object, auto-fetch service points
      if (postcode && postcode.length >= 4) {
        console.log("📍 Auto-fetching service points for postcode:", postcode, countryCode);
        setTimeout(() => fetchServicePoints(postcode, countryCode), 500);
      }
    } else {
      // Fallback: parse display_name string
      console.log("⚠️ No address object, parsing display_name:", s.display_name);
      
      // Try to extract postcode from display_name - often formatted as "Street, PostcodeCity, Country"
      let postcode = "";
      const postcodeMatch = s.display_name.match(/\b(\d{4,5})\b/);
      if (postcodeMatch) {
        postcode = postcodeMatch[1];
        console.log("Extracted postcode from display_name:", postcode);
      }
      
      const parts = s.display_name.split(",").map(p => p.trim());
      const lastPart = parts[parts.length - 1] || "";
      const countryCode = normalizeCountryCode(lastPart);
      
      console.log("Parsed address parts:", { parts, lastPart, countryCode });
      
      setShippingData(prev => ({
        ...prev,
        streetNumber: parts[0] || "",
        street: parts[1] || "",
        district: parts[2] || "",
        city: parts[3] || parts[4] || "",
        postcode: postcode,
        country: countryCode,
      }));
      
      // If we extracted postcode, auto-fetch service points
      if (postcode && postcode.length >= 4) {
        console.log("📍 Auto-fetching service points for postcode:", postcode, countryCode);
        setTimeout(() => fetchServicePoints(postcode, countryCode), 500);
      }
    }
  }

  function handleChange(e) {
    const value = e.target.value;
    setQuery(value);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => fetchSuggestions(value), 1200);
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  function goToShipping() {
    const trimmedEmail = userInfo.email.trim();

    if (!isValidEmail(trimmedEmail)) {
      setEmailError("Skriv inn en gyldig e-postadresse.");
      return;
    }

    setEmailError("");
    setShippingData(prev => ({ ...prev, ...userInfo, email: trimmedEmail }));
    setStep(2);
  }

  function handleSave() {
    // Normalize country code before saving
    const normalizedCountry = normalizeCountryCode(shippingData.country);
    const finalShippingData = { ...shippingData, country: normalizedCountry };
    
    console.log("FINAL DATASET:", finalShippingData);
    setShippingData(finalShippingData);
    
    // After saving address, fetch available service points
    setStep(3);
    // persist to localStorage
    try { localStorage.setItem("norya_shipping", JSON.stringify(finalShippingData)); } catch (e) {}
    fetchServicePoints(finalShippingData.postcode, normalizedCountry);
  }

  async function fetchServicePoints(postcode, country_code = "DK") {
    setLoadingServicePoints(true);
    setServiceError(null);
    try {
      console.log("🚀 Fetching service points for:", { postcode, country_code });
      const res = await fetch("/api/shipmondo/service-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postcode, country_code }),
      });
      const data = await res.json();
      console.log("✅ Service points response:", data);
      if (data.options && data.options.length > 0) {
        console.log("📍 Found", data.options.length, "service points");
        setServicePoints(data.options);
        
        // Auto-fill city and district from first service point
        const firstPoint = data.options[0];
        console.log("📍 Auto-filling from first service point:", { city: firstPoint.city, district: firstPoint.city });
        setShippingData(prev => ({
          ...prev,
          city: firstPoint.city || prev.city,
          district: firstPoint.city || prev.district,
        }));
      } else {
        console.warn("⚠️ No options in response");
        setServicePoints([]);
      }
    } catch (err) {
      console.error("❌ Failed to fetch service points:", err);
      setServiceError(String(err));
      setServicePoints([]);
    } finally {
      setLoadingServicePoints(false);
    }
  }

  function handleSelectShipping(opt) {
    const selection = { 
      id: opt.id, 
      name: opt.name, 
      cost: opt.cost, 
      details: opt,
      // Include all customer shipping data
      customerData: shippingData 
    };
    // Don't call parent callback yet - just save and show review
    setSelectedServicePoint(selection);
    setStep(4);
  }

  function confirmAndProceed() {
    if (selectedServicePoint && typeof onShippingSelected === "function") {
      onShippingSelected(selectedServicePoint);
    }
  }

  const inputClasses = "w-full p-3 rounded-xl border border-gray-400 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all duration-300";
  const cardClasses = "rounded-3xl shadow-2xl bg-white p-8 space-y-6 text-gray-900";
  const buttonClasses = "w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-semibold shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]";

  useEffect(() => {
    // load saved shipping data if available
    try {
      const saved = localStorage.getItem("norya_shipping");
      if (saved) {
        const parsed = JSON.parse(saved);
        setShippingData(prev => ({ ...prev, ...parsed }));
      }
      // Don't auto-proceed with previously selected shipping - let user choose again
    } catch (e) {
      // ignore
    }
  }, []);

  // Keep ref updated with current shipping data
  useEffect(() => {
    shippingDataRef.current = shippingData;
  }, [shippingData]);

  return (
    <div className="max-w-xl mx-auto p-6">
      {step === 1 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cardClasses}>
          <h2 className="text-2xl font-semibold text-blue-700 tracking-wide">Dine detaljer</h2>
          <div>
            <label>Navn</label>
            <input className={inputClasses} value={userInfo.name} onChange={e => setUserInfo({ ...userInfo, name: e.target.value })} />
          </div>
          <div>
            <label>E-post</label>
            <input
              type="email"
              autoComplete="email"
              className={inputClasses}
              value={userInfo.email}
              onChange={e => {
                setUserInfo({ ...userInfo, email: e.target.value });
                if (emailError) setEmailError("");
              }}
            />
            {emailError && <p className="mt-2 text-sm text-red-600">{emailError}</p>}
          </div>
          <button onClick={goToShipping} className={buttonClasses}>Neste</button>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cardClasses}>
          <h2 className="text-2xl font-semibold text-blue-700 tracking-wide">Fraktinformasjon</h2>
          <div>
            <label>Telefonnummer</label>
            <input className={inputClasses} value={shippingData.phone} onChange={e => setShippingData({ ...shippingData, phone: e.target.value })} />
          </div>
          <div>
            <label>Adresse</label>
            <input className={inputClasses} value={query} onChange={handleChange} placeholder="Skriv inn adresse..." />
          </div>
          {addressSuggestions.length > 0 && (
            <motion.ul initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-100 border border-gray-300 rounded-xl shadow p-3 space-y-2">
              {addressSuggestions.map(s => (
                <li key={s.place_id} onClick={() => handleSelect(s)} className="p-3 hover:bg-blue-100 cursor-pointer rounded-xl transition-all">{s.display_name}</li>
              ))}
            </motion.ul>
          )}
          {[
            { key: 'street', label: 'Gate' },
            { key: 'streetNumber', label: 'Husnummer' },
            { key: 'district', label: 'Distrikt' },
            { key: 'city', label: 'By' },
            { key: 'country', label: 'Land' }
          ].map(({ key, label }) => (
            <div key={key}>
              <label>{label}</label>
              <input className={inputClasses} value={shippingData[key]} onChange={e => setShippingData({ ...shippingData, [key]: e.target.value })} />
            </div>
          ))}
          <div>
            <label>Postnummer</label>
            <input 
              className={inputClasses} 
              value={shippingData.postcode} 
              onChange={e => {
                const newPostcode = e.target.value;
                setShippingData(prev => ({ ...prev, postcode: newPostcode }));
                
                // Debounce postal code lookup
                if (postalCodeTimeout.current) clearTimeout(postalCodeTimeout.current);
                postalCodeTimeout.current = setTimeout(() => {
                  if (newPostcode.length >= 4) {
                    console.log("User entered postal code:", newPostcode);
                    const country = shippingDataRef.current.country || "DK";
                    fetchServicePoints(newPostcode, country);
                  }
                }, 800);
              }}
              placeholder="Skriv inn postnummer..."
            />
          </div>
          <button onClick={handleSave} className={buttonClasses}>Lagre</button>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cardClasses}>
          <h2 className="text-2xl font-semibold text-blue-700 tracking-wide">Lagret informasjon</h2>
          {Object.entries(shippingData).map(([key,value]) => (
            <div key={key} className="border-b border-gray-300 pb-2">
              <strong className="capitalize">{key}:</strong> {value}
            </div>
          ))}
          <div className="mt-4">
            <p className="mb-2">Velg et hentested eller leveringsmetode fra listen under:</p>
            {loadingServicePoints ? (
              <p className="text-gray-500">Søker etter tilgjengelige alternativer...</p>
            ) : serviceError ? (
              <p className="text-red-600">Feil ved henting av alternativer: {serviceError}</p>
            ) : servicePoints.length === 0 ? (
              <p className="text-gray-500">Ingen hentesteder funnet for postnummeret.</p>
            ) : (
              <div className="space-y-2">
                {servicePoints.map(opt => (
                  <label key={opt.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                    <input type="radio" name="shipopt" onChange={() => handleSelectShipping(opt)} />
                    <div>
                      <div className="font-medium">{opt.name}</div>
                      <div className="text-sm text-gray-600">{opt.address} {opt.postcode} {opt.city}</div>
                    </div>
                    <div className="ml-auto font-semibold">{(opt.cost/100).toFixed(2)} NOK</div>
                  </label>
                ))}
              </div>
            )}

            {/* Create shipment button and status */}
            <div className="mt-4">
              <CreateShipmentButton
                shipmentData={{ ...shippingData, servicePoint: selectedServicePoint }}
                onStatus={(status, payload) => setCreateShipmentStatus({ status, payload })}
              />
              {createShipmentStatus && (
                <div className="mt-2 text-sm">
                  {createShipmentStatus.status === 1 ? (
                    <span className="text-green-600">Forsendelse opprettet ✅</span>
                  ) : (
                    <span className="text-red-600">Forsendelse mislyktes ❌</span>
                  )}
                </div>
              )}
            </div>
          </div>
      
        </motion.div>
      )}

      {step === 4 && selectedServicePoint && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cardClasses}>
          <h2 className="text-2xl font-semibold text-blue-700 tracking-wide">Bekreft fraktvalg</h2>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">Leveringssted:</label>
              <p className="text-lg font-semibold text-gray-900">{selectedServicePoint.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Pris:</label>
              <p className="text-lg font-semibold text-gray-900">{(selectedServicePoint.cost / 100).toFixed(2)} NOK</p>
            </div>
          </div>

          <div className="space-y-2 pt-4">
            <button onClick={confirmAndProceed} className={buttonClasses}>
              Fortsett til betaling →
            </button>
            <button onClick={() => setStep(3)} className="w-full bg-gray-300 hover:bg-gray-400 text-gray-900 p-4 rounded-2xl font-semibold transition">
              ← Velg annet sted
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );

}