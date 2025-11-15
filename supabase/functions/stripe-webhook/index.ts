// supabase/functions/stripe-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    return new Response('Missing signature or webhook secret', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Webhook event:', event.type);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;

        if (!userId) {
          console.error('No user ID in session metadata');
          break;
        }

        // Check if this is a subscription or one-time payment
        if (session.mode === 'payment') {
          // One-time payment (AI call pack purchase)
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
          const purchasedItem = lineItems.data[0];

          if (purchasedItem) {
            const priceId = purchasedItem.price?.id;
            const aiCallPackPriceId = Deno.env.get('VITE_STRIPE_AI_CALL_PACK_25_PRICE_ID');

            if (priceId === aiCallPackPriceId) {
              // Add 25 consumable AI calls
              const { error } = await supabase.rpc('add_consumable_calls', {
                user_uuid: userId,
                calls_to_add: 25,
              });

              if (error) {
                console.error('Error adding consumable calls:', error);
              } else {
                console.log(`Added 25 consumable AI calls to user ${userId}`);
              }
            }
          }
        } else if (session.mode === 'subscription') {
          // Subscription purchase (Pro or Premium)
          const subscriptionId = session.subscription as string;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          // Determine tier based on price ID
          let tier: 'free' | 'pro' | 'premium' = 'free';
          const priceId = subscription.items.data[0]?.price.id;

          // Match price ID to tier (you'll need to configure these)
          const proPriceIds = [
            Deno.env.get('VITE_STRIPE_PRO_PRICE_ID'),
            Deno.env.get('VITE_STRIPE_PRO_YEARLY_PRICE_ID'),
          ];
          const premiumPriceIds = [
            Deno.env.get('VITE_STRIPE_PREMIUM_PRICE_ID'),
            Deno.env.get('VITE_STRIPE_PREMIUM_YEARLY_PRICE_ID'),
          ];

          if (proPriceIds.includes(priceId)) {
            tier = 'pro';
          } else if (premiumPriceIds.includes(priceId)) {
            tier = 'premium';
          }

          // Update user subscription using the database function
          const { error } = await supabase.rpc('update_subscription_tier', {
            user_uuid: userId,
            new_tier: tier,
            new_stripe_customer_id: session.customer as string,
            new_stripe_subscription_id: subscriptionId,
          });

          if (error) {
            console.error('Error updating subscription:', error);
          } else {
            console.log(`Updated user ${userId} to ${tier} tier`);
          }
        }

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (!userId) {
          console.error('No user ID in subscription metadata');
          break;
        }

        // Check subscription status
        if (subscription.status === 'active') {
          // Determine tier
          let tier: 'free' | 'pro' | 'premium' = 'free';
          const priceId = subscription.items.data[0]?.price.id;

          const proPriceIds = [
            Deno.env.get('VITE_STRIPE_PRO_PRICE_ID'),
            Deno.env.get('VITE_STRIPE_PRO_YEARLY_PRICE_ID'),
          ];
          const premiumPriceIds = [
            Deno.env.get('VITE_STRIPE_PREMIUM_PRICE_ID'),
            Deno.env.get('VITE_STRIPE_PREMIUM_YEARLY_PRICE_ID'),
          ];

          if (proPriceIds.includes(priceId)) {
            tier = 'pro';
          } else if (premiumPriceIds.includes(priceId)) {
            tier = 'premium';
          }

          await supabase.rpc('update_subscription_tier', {
            user_uuid: userId,
            new_tier: tier,
            new_stripe_subscription_id: subscription.id,
          });

          console.log(`Updated subscription for user ${userId} to ${tier}`);
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (!userId) {
          console.error('No user ID in subscription metadata');
          break;
        }

        // Downgrade to free tier
        await supabase.rpc('update_subscription_tier', {
          user_uuid: userId,
          new_tier: 'free',
        });

        // Clear subscription IDs
        await supabase
          .from('profiles')
          .update({
            stripe_subscription_id: null,
            billing_period_start: null,
            billing_period_end: null,
          })
          .eq('id', userId);

        console.log(`Downgraded user ${userId} to free tier`);

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find user by customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          console.log(`Payment failed for user ${profile.id}`);
          // Optionally: Send notification to user, downgrade after grace period, etc.
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Webhook error' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
