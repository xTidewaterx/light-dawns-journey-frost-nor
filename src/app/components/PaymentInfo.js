'use client';

import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

export default function PaymentInfo({ activeTheme }) {
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;

  // Load existing payment info
  useEffect(() => {
    const loadPaymentInfo = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists() && userSnap.data()?.stripeConnectId) {
          setPaymentInfo({
            stripeConnectId: userSnap.data().stripeConnectId,
            connectedAt: userSnap.data().stripeConnectAt,
            email: userSnap.data().stripeConnectEmail,
          });
        }
      } catch (err) {
        console.error('Error loading payment info:', err);
        setError('Kunne ikke laste betalingsinformasjon.');
      } finally {
        setLoading(false);
      }
    };

    loadPaymentInfo();
  }, [user, db]);

  const handleConnectStripe = async () => {
    if (!user?.uid) {
      setError('Du må være logget inn.');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      console.log('🚀 STEP 1: Sending Stripe Connect request');
      console.log('   User ID:', user.uid);
      console.log('   Email:', user.email);
      console.log('   Name:', user.displayName || 'Creator');
      
      const response = await fetch('/api/stripe-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName || 'Creator',
        }),
      });

      console.log('📨 STEP 2: Got response from server');
      console.log('   Status:', response.status);
      console.log('   Content-Type:', response.headers.get('content-type'));

      let data;
      try {
        data = await response.json();
        console.log('📦 STEP 3: Parsed response as JSON');
      } catch (parseErr) {
        console.error('❌ STEP 3 FAILED: Could not parse as JSON');
        console.error('   Error:', parseErr.message);
        const text = await response.text();
        console.error('   Raw response (first 500 chars):', text.substring(0, 500));
        throw new Error(`Invalid JSON response from server: ${response.status}`);
      }

      console.log('📋 STEP 4: Full response data structure:');
      console.log('   Keys:', Object.keys(data));
      console.log('   Full data:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        console.error('❌ STEP 5: Response status indicates error');
        console.error('   Status:', response.status);
        console.error('   Error from API:', data.error);
        throw new Error(data.error || `API error: ${response.status}`);
      }

      console.log('✅ STEP 5: Response status is OK');

      console.log('🔍 STEP 6: Validating URL');
      console.log('   URL value:', data.url);
      console.log('   URL type:', typeof data.url);
      console.log('   URL is string?', typeof data.url === 'string');
      console.log('   URL length:', data.url?.length);
      console.log('   URL first 100 chars:', data.url?.substring(0, 100));

      if (!data.url) {
        console.error('❌ STEP 6 FAILED: URL is missing or empty');
        console.error('   data.url =', data.url);
        console.error('   Full response:', JSON.stringify(data));
        throw new Error(`URL is missing from response`);
      }

      if (typeof data.url !== 'string') {
        console.error('❌ STEP 6 FAILED: URL is not a string');
        console.error('   URL type:', typeof data.url);
        console.error('   URL value:', data.url);
        throw new Error(`URL must be a string, got ${typeof data.url}`);
      }

      console.log('✅ STEP 6: URL is valid string');

      console.log('🔍 STEP 7: Validating URL format');
      console.log('   Starts with https://?', data.url.startsWith('https://'));
      console.log('   Starts with http://?', data.url.startsWith('http://'));
      console.log('   Includes "stripe"?', data.url.includes('stripe'));

      if (!data.url.startsWith('https://') && !data.url.startsWith('http://')) {
        console.error('❌ STEP 7 FAILED: URL does not start with http:// or https://');
        console.error('   Actual URL:', data.url);
        throw new Error('URL must start with http:// or https://');
      }

      console.log('✅ STEP 7: URL format is valid');

      console.log('🔍 STEP 8: Checking account ID');
      console.log('   Account ID:', data.accountId);
      console.log('   Account ID type:', typeof data.accountId);

      if (!data.accountId) {
        console.error('❌ STEP 8 FAILED: No account ID');
        throw new Error('No account ID received from server');
      }

      console.log('✅ STEP 8: Account ID is present');

      console.log('✅ ALL VALIDATIONS PASSED!');

      // Save account ID to Firestore before redirecting
      try {
        console.log('💾 STEP 9: Saving to Firestore');
        const userRef = doc(db, 'users', user.uid);
        await setDoc(
          userRef,
          {
            stripeConnectId: data.accountId,
            stripeConnectEmail: user.email,
            stripeConnectAt: new Date().toISOString(),
          },
          { merge: true }
        );
        console.log('✅ STEP 9: Saved to Firestore successfully');
      } catch (firestoreErr) {
        console.warn('⚠️ STEP 9: Firestore save failed (but continuing)');
        console.warn('   Error:', firestoreErr.message);
      }

      // Redirect to Stripe Connect onboarding
      console.log('🔗 STEP 10: REDIRECTING TO STRIPE');
      console.log('   Target URL:', data.url);
      console.log('   (This page will navigate in 100ms...)');
      
      // Use a small delay to ensure logs are flushed
      setTimeout(() => {
        console.log('🔀 NOW NAVIGATING...');
        window.location.href = data.url;
      }, 100);
      
    } catch (err) {
      console.error('\n❌❌❌ FATAL ERROR ❌❌❌');
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      console.error('Error type:', err.name);
      setError(err.message || 'Feil ved tilkobling av Stripe');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user?.uid) return;

    if (!window.confirm('Er du sikker på at du vil koble fra Stripe? Du vil ikke motta betalinger før du kobler til igjen.')) {
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(
        userRef,
        {
          stripeConnectId: null,
          stripeConnectAt: null,
          stripeConnectEmail: null,
        },
        { merge: true }
      );

      setPaymentInfo(null);
      setSuccess('Stripe kontoen er koblet fra.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error disconnecting Stripe:', err);
      setError('Kunne ikke koble fra Stripe.');
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.08)] sm:p-8"
        style={{ borderColor: activeTheme?.border }}>
        <p className="text-sm text-slate-600">Laster betalingsinformasjon...</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.08)] sm:p-8"
      style={{ borderColor: activeTheme?.border }}>
      <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Inntektskilde</p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-900">Betalingsinformasjon</h2>
      <p className="mt-2 text-sm text-slate-600">
        Koble til Stripe for å motta betalinger når kunder kjøper produktene dine.
      </p>

      {error && (
        <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-700">
          {success}
        </div>
      )}

      {paymentInfo?.stripeConnectId ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Status</div>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
              <span className="font-semibold text-emerald-700">Tilkoblet</span>
            </div>
          </div>

          {paymentInfo.email && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Stripe E-post</div>
              <div className="mt-2 text-sm font-medium text-slate-900">{paymentInfo.email}</div>
            </div>
          )}

          {paymentInfo.connectedAt && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Tilkoblet siden</div>
              <div className="mt-2 text-sm font-medium text-slate-900">
                {new Date(paymentInfo.connectedAt).toLocaleDateString('no-NO')}
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <a
              href="https://dashboard.stripe.com/account"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-xl border px-4 py-3 text-white font-semibold transition hover:brightness-95 active:brightness-90 text-center"
              style={{ backgroundColor: activeTheme?.accent, borderColor: activeTheme?.accent }}
            >
              Åpne Stripe Dashboard
            </a>
            <button
              onClick={handleDisconnect}
              className="flex-1 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-red-700 font-semibold transition hover:bg-red-100"
            >
              Koble Fra
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <button
            onClick={handleConnectStripe}
            disabled={connecting}
            className="w-full rounded-xl border px-4 py-3 text-white font-semibold transition hover:brightness-95 active:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: activeTheme?.accent, borderColor: activeTheme?.accent }}
          >
            {connecting ? 'Kobler til...' : 'Koble til Stripe'}
          </button>
          <p className="mt-3 text-xs text-slate-500">
            Du trenger en Stripe-konto for å motta betalinger. Hvis du ikke har en, opprettes den under prosessen.
          </p>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="text-sm font-medium text-amber-900">💡 Tips</div>
        <p className="mt-2 text-xs text-amber-800">
          Når du kobler til Stripe, kan kundene dine sikkert betale for produktene dine. Pengene overføres direkte til Stripe-kontoen din.
        </p>
      </div>
    </div>
  );
}
