import Stripe from 'stripe';

// Validate Stripe key exists
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('⚠️ STRIPE_SECRET_KEY is not set!');
}

let stripe;

try {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2022-11-15',
  });
} catch (err) {
  console.error('Failed to initialize Stripe:', err.message);
}

export async function POST(req) {
  try {
    // Validate Stripe is initialized
    if (!stripe || !process.env.STRIPE_SECRET_KEY) {
      console.error('Stripe not properly initialized');
      return new Response(
        JSON.stringify({ 
          error: 'Stripe integration not configured. Please check STRIPE_SECRET_KEY.',
          missing: !process.env.STRIPE_SECRET_KEY,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { userId, userEmail, userName } = body;

    console.log('📝 Stripe Connect request received:', { userId, userEmail, userName });

    if (!userId || !userEmail) {
      console.warn('Missing required fields:', { userId, userEmail });
      return new Response(
        JSON.stringify({ error: 'Missing userId or userEmail' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

try {
  console.log('🔄 Creating Stripe Connect account...');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return {
      error: 'Missing NEXT_PUBLIC_APP_URL — must be a valid HTTPS domain.',
    };
  }

  // Create new Stripe Connect account
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'NO',
    email: userEmail,
    business_profile: {
      name: userName || 'NORYA Creator',
      url: appUrl,
    },
  });

  console.log('✅ Stripe account created:', account.id);

  // Create account link for onboarding
  console.log('🔗 Creating account link...');
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    type: 'account_onboarding',
    refresh_url: `${appUrl}/profile?stripe=refresh`,
    return_url: `${appUrl}/profile?stripe=success`,
  });

  console.log('✅ Account link created');


      const response = {
        url: accountLink.url,
        accountId: account.id,
      };

      console.log('📤 Returning response with URL:', accountLink.url?.substring(0, 50) + '...');

      return new Response(
        JSON.stringify(response),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (stripeErr) {
      console.error('❌ Stripe API error:', stripeErr.message);
      console.error('Error type:', stripeErr.type);
      console.error('Error code:', stripeErr.code);
      
      return new Response(
        JSON.stringify({ 
          error: stripeErr.message || 'Stripe API error',
          type: stripeErr.type,
          code: stripeErr.code,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (err) {
    console.error('❌ Fatal error in stripe-connect route:', err.message);
    console.error('Stack:', err.stack);
    
    return new Response(
      JSON.stringify({ 
        error: err.message || 'Internal server error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
