'use client';

import { useCart } from "react-use-cart";
import { useState, useEffect, useMemo, use, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ShippingForm from "../../components/ShippingForm";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import Image from "next/image";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Payment form component - displays shipping summary and payment element
function CheckoutForm({ onBack, shippingOption, items }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');
    setMessage('');







    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/success` },
    });

    if (submitError) {
      setError(submitError.message);
      console.error("❌ Payment error:", submitError);
    }
    setLoading(false);
  };

  if (!stripe || !elements) {
    return <p className="text-red-600">Payment setup failed. Please refresh the page.</p>;
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalSum = subtotal + shippingOption.cost;

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-4">Orderoversikt</h3>
        
        <div className="space-y-2 mb-4 pb-4 border-b border-blue-200">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm text-blue-800">
              <span>{item.quantity}x {item.name}</span>
              <span>{((item.price * item.quantity) / 100).toFixed(2)} NOK</span>
            </div>
          ))}
        </div>

        <div className="space-y-2 mb-4 pb-4 border-b border-blue-200">
          <div className="flex justify-between text-blue-900">
            <span className="font-medium">Subtotal:</span>
            <span>{(subtotal / 100).toFixed(2)} NOK</span>
          </div>
          <div className="flex justify-between text-blue-900">
            <span className="font-medium">Frakt:</span>
            <span>{(shippingOption.cost / 100).toFixed(2)} NOK</span>
          </div>
        </div>

        <div className="flex justify-between text-lg font-semibold text-blue-950">
          <span>Total:</span>
          <span className="text-yellow-600">{(totalSum / 100).toFixed(2)} NOK</span>
        </div>

        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-sm font-medium text-blue-900 mb-2">Leveringsalternativ:</p>
          <p className="text-sm text-blue-800">{shippingOption.name}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="font-semibold text-blue-900 mb-4">Betalingsmetode</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentElement />
          <button
            type="submit"
            disabled={!stripe || loading}
            className="w-full bg-yellow-400 text-blue-950 font-semibold py-3 rounded-lg hover:bg-yellow-300 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Behandler betaling…" : "Fullfør betaling"}
          </button>
          {message && <div className="text-green-600 mt-2 font-medium text-sm">{message}</div>}
          {error && <div className="text-red-600 mt-2 text-sm">{error}</div>}
        </form>
      </div>

      <button
        onClick={onBack}
        className="mt-6 text-blue-700 underline hover:text-blue-900 font-medium text-sm"
      >
        ← Tilbake til frakt
      </button>
    </div>
  );
}

export default function CartPage() {
  const { items, removeItem, updateItemQuantity, emptyCart, isInitialized, setItems } = useCart();
  const [currentItems, setCurrentItems] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [clientSecret, setClientSecret] = useState(null);
  const [loadingSecret, setLoadingSecret] = useState(false);
  const [cartKey, setCartKey] = useState(0);
  const syncedRef = useRef(false);
  const [shippingOption, setShippingOption] = useState({ 
    id: 'standard', 
    name: 'Standard frakt (2-4 dager)', 
    cost: 9900
  });




useEffect(() => {
  setIsClient(true);
}, []);

// Sync cart state from localStorage on first render - only once
useEffect(() => {
  if (!isClient || syncedRef.current) return;

  try {
    const raw = localStorage.getItem("react-use-cart");
    const lsItems = JSON.parse(raw)?.items || [];
    
    // Initialize cart state with localStorage data
    if (lsItems.length > 0) {
      setItems(lsItems);
      setCurrentItems(lsItems);
      console.log("✅ Cart synced from localStorage:", lsItems);
    }
    syncedRef.current = true;
  } catch (err) {
    console.error("❌ Failed to sync cart from localStorage:", err);
    syncedRef.current = true;
  }
}, [isClient, setItems]);




console.log("🛒 CartPage rendered with items:", items, "isInitialized:", isInitialized, "isClient:", isClient);

  //instead of loading the cart items from the hook's state which might not be updated yet due to reactivity issues, we can directly access localStorage where the cart data is persisted. This way we ensure we are logging the most current state of the cart even if there are issues with the component's state updates.
    if (!isInitialized) {
      console.log((items))
    console.warn("CheckoutForm rendered before Stripe was initialized");
 // return <p>Laster handlekurv…</p>;
}

  useEffect(() => {
  setCurrentItems(items);
}, [items]);

  console.log("🛒 CartPage rendered with items:", items);
  // Load saved shipping option on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("norya_selected_shipping");
      if (saved) setShippingOption(JSON.parse(saved));
    } catch (e) {
      console.error("Failed to load shipping option:", e);
    }
  }, []);

  // Ensure component is client-rendered and cart is synchronized
  useEffect(() => {
    setIsClient(true);
    // Force re-render when component mounts to sync with latest cart data
    setCartKey(prev => prev + 1);
  }, []);

  if (!isClient) return null;
  const handleProceedToShipping = () => {
    if (items.length === 0) {
      alert("Handlekurven er tom");
      return;
    }
    setCheckoutStep(2);
  };

  // Called when shipping is selected in ShippingForm
  const handleShippingSelected = (option) => {
    setShippingOption(option);
    try {
      localStorage.setItem("norya_selected_shipping", JSON.stringify(option));
    } catch (e) {
      console.error("Failed to save shipping option:", e);
    }
    // Pass the newly selected option directly to avoid stale state
    handleProceedToPayment(option);
  };

  // Move from shipping to payment step
  const handleProceedToPayment = async (shippingOptionToUse) => {
    setLoadingSecret(true);
    try {
      const lineItems = items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
      }));

      // Use the passed option or fall back to current state
      const activeShippingOption = shippingOptionToUse || shippingOption;
      
      console.log("📤 Sending checkout request with:", { items: lineItems, shipping: activeShippingOption });

      const res = await fetch("/api/checkout_sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: lineItems, shipping: activeShippingOption }),
      });

      const data = await res.json();
      
      console.log("📥 Checkout response status:", res.status);
      console.log("📥 Checkout response data:", data);

      if (!res.ok) {
        console.error("❌ API returned error status:", res.status);
        console.error("❌ API error:", data.error || data);
        alert(`Feil: ${data.error || "Ukjent feil ved betaling"}`);
        setLoadingSecret(false);
        return;
      }

      if (data.client_secret) {
        setClientSecret(data.client_secret);
        setCheckoutStep(3);
        console.log("✅ Payment Intent created and ready");
      } else {
        console.error("No client_secret returned:", data);
        alert("Feil ved initialisering av betaling. Prøv igjen.");
      }
    } catch (err) {
      console.error("Error creating checkout session:", err);
      alert("Feil ved initialisering av betaling. Prøv igjen.");
    }
    setLoadingSecret(false);
  };

  const cardTransition = { duration: 0.4, ease: "easeInOut" };
  const containerStyle = {
    perspective: 2000,
    transformStyle: "preserve-3d",
    width: "100%",
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalSum = subtotal + shippingOption.cost;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex justify-center items-center px-6 py-10">
      <div style={containerStyle} className="flex justify-center w-full">
        <AnimatePresence mode="wait">
          {/* STEP 1: Cart view */}
          {checkoutStep === 1 && (
            <motion.div
              key="cart"
              initial={{ rotateY: 0, scale: 1, rotateX: 0 }}
              animate={{ rotateY: 0, scale: 1, rotateX: 0 }}
              exit={{
                rotateY: 180,
                rotateX: 5,
                scale: 0.97,
                opacity: 0.95,
              }}
              transition={cardTransition}
              className="grid md:grid-cols-2 w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden"
              style={{ backfaceVisibility: "hidden", transformOrigin: "center" }}
            >
              {/* Left column – products */}
              <div className="p-8 md:p-10">
                <h1 className="text-3xl font-semibold text-blue-950 mb-8 text-center tracking-wide">
                  Handlekurv
                </h1>

                {items.length === 0 ? (
                  <p className="text-center text-blue-800">Handlekurven er tom.</p>
                ) : (
                  <div key={`items-${currentItems.length}-${currentItems.map(i => i.id).join('-')}`} className="space-y-8">
                    
                    {currentItems.map((item) => (
                    
              
                      <div key={item.id} className="flex items-center justify-between border-b border-blue-200 pb-5">
                        <div className="flex items-center space-x-4">
                          <div className="relative w-20 h-20">
                            <Image
                              src={item.images?.[0] || "/placeholder.png"}
                              alt={item.name}
                              fill
                              className="object-cover rounded-xl border border-blue-200 shadow-sm"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-blue-950 text-lg">{item.name}</p>
                            {item.artist && (
                              <p className="text-blue-700 text-sm font-light">av {item.artist}</p>
                            )}
                            <p className="text-blue-800 text-sm font-semibold mt-1">
                              {(item.price / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })} NOK
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <button 
                            onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                            className="px-3 py-1 bg-blue-100 text-blue-900 rounded-md hover:bg-blue-200 transition"
                          >
                            −
                          </button>
                          <span className="font-semibold text-blue-900">{item.quantity}</span>
                      <button
  onClick={() => 
    updateItemQuantity(item.id, item.quantity + 1)}
  className="px-3 py-1 bg-blue-100 text-blue-900 rounded-md hover:bg-blue-200 transition"
>
  +
</button>

                          <button 
                            onClick={() => removeItem(item.id)}
                            className="px-4 py-1 text-sm bg-yellow-400 text-blue-950 font-medium rounded-md hover:bg-yellow-300 transition"
                          >
                            Fjern
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right column – summary */}
              <div className="bg-blue-400 text-blue-50 p-8 md:p-10 flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl font-semibold mb-6">Oppsummering</h2>
                  
                  <div className="mb-6">
                    <p className="text-blue-100 mb-2 font-medium">Frakt:</p>
                    <p className="text-blue-50 text-sm">{shippingOption.name}</p>
                    <p className="text-yellow-300 font-semibold mt-1">{(shippingOption.cost/100).toFixed(2)} NOK</p>
                  </div>

                  <div className="flex justify-between text-lg font-medium border-t border-blue-700 pt-4">
                    <span>Subtotal:</span>
                    <span className="text-yellow-400">
                      {(subtotal / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })} NOK
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-medium mt-2">
                    <span>Frakt:</span>
                    <span className="text-yellow-400">
                      {(shippingOption.cost / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })} NOK
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold mt-2 border-t border-blue-700 pt-2">
                    <span>Total:</span>
                    <span className="text-yellow-400">
                      {(totalSum / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })} NOK
                    </span>
                  </div>
                </div>

                <div className="mt-10 space-y-4">
                  <button
                    onClick={handleProceedToShipping}
                    disabled={items.length === 0}
                    className="w-full bg-yellow-400 text-blue-950 font-semibold py-3 rounded-lg hover:bg-yellow-300 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Gå til frakt →
                  </button>
                  <button
                    onClick={emptyCart}
                    className="w-full bg-blue-800 text-white py-3 rounded-lg hover:bg-blue-700 transition"
                  >
                    Tøm handlekurv
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Shipping selection */}
          {checkoutStep === 2 && (
            <motion.div
              key="shipping"
              initial={{ rotateY: -180, rotateX: -5, scale: 0.97, opacity: 0.95 }}
              animate={{ rotateY: 0, rotateX: 0, scale: 1, opacity: 1 }}
              exit={{ rotateY: 180, rotateX: 5, scale: 0.97, opacity: 0.95 }}
              transition={cardTransition}
              className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 md:p-10"
              style={{ backfaceVisibility: "hidden", transformOrigin: "center" }}
            >
              <ShippingForm onShippingSelected={handleShippingSelected} />
              <button
                onClick={() => setCheckoutStep(1)}
                className="mt-6 text-blue-700 underline hover:text-blue-900 font-medium"
              >
                ← Tilbake til handlekurv
              </button>
            </motion.div>
          )}

          {/* STEP 3: Payment */}
          {checkoutStep === 3 && clientSecret && (
            <motion.div
              key="payment"
              initial={{ rotateY: -180, rotateX: -5, scale: 0.97, opacity: 0.95 }}
              animate={{ rotateY: 0, rotateX: 0, scale: 1, opacity: 1 }}
              exit={{ rotateY: 180, rotateX: 5, scale: 0.97, opacity: 0.95 }}
              transition={cardTransition}
              className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl p-8 md:p-10"
              style={{ backfaceVisibility: "hidden", transformOrigin: "center" }}
            >
              <Elements stripe={stripePromise} options={{ clientSecret, locale: 'nb' }}>
                <CheckoutForm 
                  onBack={() => setCheckoutStep(2)} 
                  shippingOption={shippingOption}
                  items={items}
                />
              </Elements>
            </motion.div>
          )}

          {/* Loading state for payment */}
          {checkoutStep === 3 && !clientSecret && (
            <motion.div
              key="loading"
              className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-10 flex flex-col items-center justify-center"
            >
              <p className="text-gray-600 text-lg">Forbereder betaling…</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
