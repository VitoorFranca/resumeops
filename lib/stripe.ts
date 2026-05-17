import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createCheckoutSession(userId: string, email: string) {
  return stripe.checkout.sessions.create({
    customer_email: email,
    mode: 'subscription',
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_DOMAIN}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_DOMAIN}/dashboard`,
    metadata: { userId },
    subscription_data: { trial_period_days: 7 },
    allow_promotion_codes: true,
  });
}
