import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import pg from 'pg';

const { Pool } = pg;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover'
});

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

export const config = {
    api: {
        bodyParser: false,
    },
};

async function buffer(readable: any) {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    if (!sig) {
        return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            buf,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.user_id;

                if (userId && session.subscription) {
                    await pool.query(
                        `UPDATE users 
             SET subscription_tier = 'premium',
                 subscription_status = 'active',
                 subscription_start_date = NOW(),
                 stripe_subscription_id = $1
             WHERE id = $2`,
                        [session.subscription, userId]
                    );

                    // Log payment
                    await pool.query(
                        `INSERT INTO payments (user_id, stripe_payment_id, amount, currency, status)
             VALUES ($1, $2, $3, $4, 'succeeded')`,
                        [userId, session.payment_intent, session.amount_total, session.currency]
                    );
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                // Find user by customer ID
                const userResult = await pool.query(
                    'SELECT id FROM users WHERE stripe_customer_id = $1',
                    [customerId]
                );

                if (userResult.rows.length > 0) {
                    const userId = userResult.rows[0].id;
                    const status = subscription.status === 'active' ? 'active' : 'inactive';

                    // Cast to any to access current_period_end potentially missing in type
                    const periodEnd = (subscription as any).current_period_end;

                    await pool.query(
                        `UPDATE users 
             SET subscription_status = $1,
                 subscription_end_date = to_timestamp($2)
             WHERE id = $3`,
                        [status, periodEnd, userId]
                    );
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                const userResult = await pool.query(
                    'SELECT id FROM users WHERE stripe_customer_id = $1',
                    [customerId]
                );

                if (userResult.rows.length > 0) {
                    const userId = userResult.rows[0].id;

                    await pool.query(
                        `UPDATE users 
             SET subscription_tier = 'free',
                 subscription_status = 'canceled',
                 subscription_end_date = NOW()
             WHERE id = $3`,
                        [userId]
                    );
                }
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                const customerId = invoice.customer as string;

                const userResult = await pool.query(
                    'SELECT id FROM users WHERE stripe_customer_id = $1',
                    [customerId]
                );

                if (userResult.rows.length > 0) {
                    const userId = userResult.rows[0].id;

                    // Log payment
                    await pool.query(
                        `INSERT INTO payments (user_id, stripe_payment_id, amount, currency, status)
             VALUES ($1, $2, $3, $4, 'succeeded')`,
                        [userId, (invoice as any).payment_intent, invoice.amount_paid, invoice.currency]
                    );
                }
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                const customerId = invoice.customer as string;

                const userResult = await pool.query(
                    'SELECT id FROM users WHERE stripe_customer_id = $1',
                    [customerId]
                );

                if (userResult.rows.length > 0) {
                    const userId = userResult.rows[0].id;

                    await pool.query(
                        `UPDATE users 
             SET subscription_status = 'past_due'
             WHERE id = $1`,
                        [userId]
                    );
                }
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return res.status(200).json({ received: true });
    } catch (error: any) {
        console.error('Error processing webhook:', error);
        return res.status(500).json({ error: 'Webhook processing failed' });
    }
}
