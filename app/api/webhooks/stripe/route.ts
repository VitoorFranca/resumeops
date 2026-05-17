import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db/client';
import type Stripe from 'stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) return Response.json({ error: 'Missing signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (userId) {
        await db.user.update({
          where: { id: userId },
          data: { plan: 'PRO', stripeId: session.customer as string },
        });
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await db.user.updateMany({
        where: { stripeId: sub.customer as string },
        data: { plan: 'FREE' },
      });
      break;
    }
  }

  return Response.json({ received: true });
}
