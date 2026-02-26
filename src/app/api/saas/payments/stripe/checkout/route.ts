import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

/**
 * @fileOverview API to create a Stripe Checkout Session for SaaS subscriptions.
 * Supports both new users (onboarding) and existing site admins (settings).
 */

export async function POST(request: Request) {
  try {
    const { planId, planName, amount, currency = 'bdt', successUrl, cancelUrl, siteId, email } = await request.json();

    if (!planId || !amount || !successUrl || !cancelUrl) {
      return NextResponse.json({ error: 'Missing required checkout parameters.' }, { status: 400 });
    }

    // Amount in Stripe is in cents/smallest currency unit
    const unitAmount = Math.round(amount * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: planName || `${planId.toUpperCase()} Subscription`,
              description: `Subscription for ${planName || planId} plan.`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: email || undefined,
      metadata: {
        planId,
        siteId: siteId || 'new_user', // If null, it's a new registration flow
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error('Stripe Checkout Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
