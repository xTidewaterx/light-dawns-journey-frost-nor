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
    country: "",
  });
  const typingTimeout = useRef(null);

  // Convert country names to ISO country codes
  function normalizeCountryCode(countryInput) {
    if (!countryInput) return "NO";
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

    return countryMap[input] || input.slice(0, 2).toUpperCase() || "NO";
  }

  async function fetchSuggestions(q) {
    if (q.length < 3) return setAddressSuggestions([]);
    try {
      const res = await fetch(`/api/address?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (Array.isArray(data)) setAddressSuggestions(data.slice(0, 5));
      else setAddressSuggestions([]);
    } catch {
      setAddressSuggestions([]);
    }
  }

  function handleSelect(s) {
    setQuery(s.display_name);
    setAddressSuggestions([]);
    if (s.address) {
      setShippingData(prev => ({
        ...prev,
        street: s.address.road || "",
        streetNumber: s.address.house_number || "",
        district: s.address.suburb || s.address.neighbourhood || "",
        city: s.address.city || s.address.town || s.address.village || "",
        postcode: s.address.postcode || "",
        country: (s.address.country_code || s.address.country || "").toString().toUpperCase(),
      }));
    } else {
      const parts = s.display_name.split(",").map(p => p.trim());
      setShippingData(prev => ({
        ...prev,
        streetNumber: parts[0] || "",
        street: parts[1] || "",
        district: parts[2] || "",
        city: parts[4] || "",
        postcode: parts[6] || "",
        country: (parts[7] || "").toString().toUpperCase(),
      }));
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

  async function fetchServicePoints(postcode, country_code = "NO") {
    setLoadingServicePoints(true);
    setServiceError(null);
    try {
      const res = await fetch("/api/shipmondo/service-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postcode, country_code }),
      });
      const data = await res.json();
      if (data.options) setServicePoints(data.options);
      else setServicePoints([]);
    } catch (err) {
      console.error("Failed to fetch service points:", err);
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
          {['street','streetNumber','district','city','postcode','country'].map(key => (
            <div key={key}>
              <label className="capitalize">{key}</label>
              <input className={inputClasses} value={shippingData[key]} onChange={e => setShippingData({ ...shippingData, [key]: e.target.value })} />
            </div>
          ))}
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
                    <span className="text-green-600">Shipment created ✅</span>
                  ) : (
                    <span className="text-red-600">Shipment failed ❌</span>
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