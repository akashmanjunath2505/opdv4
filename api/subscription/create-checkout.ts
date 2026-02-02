import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import pg from 'pg';
import { vercelAuthMiddleware } from '../../server/auth';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Verify authentication
        const authUser = vercelAuthMiddleware(req);
        if (!authUser) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get user details
        const userResult = await pool.query(
            'SELECT id, email, name, stripe_customer_id FROM users WHERE id = $1',
            [authUser.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult.rows[0];
        let customerId = user.stripe_customer_id;

        // Create Stripe customer if doesn't exist
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.name,
                metadata: {
                    user_id: user.id
                }
            });
            customerId = customer.id;

            // Save customer ID
            await pool.query(
                'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
                [customerId, user.id]
            );
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: process.env.STRIPE_PREMIUM_PRICE_ID!,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.VITE_API_URL || 'http://localhost:5173'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.VITE_API_URL || 'http://localhost:5173'}/pricing?canceled=true`,
            metadata: {
                user_id: user.id
            }
        });

        return res.status(200).json({
            sessionId: session.id,
            url: session.url
        });
    } catch (error: any) {
        console.error('Error creating checkout session:', error);
        return res.status(500).json({
            error: 'Failed to create checkout session',
            message: error.message
        });
    }
}
