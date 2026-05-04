const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

// POST /api/payments/checkout
const createCheckout = async (req, res) => {
    const { file_id } = req.body;
    try {
        const { rows } = await db.query('SELECT * FROM files WHERE id = $1 AND file_type = $2', [file_id, 'paid']);
        if (!rows.length) return res.status(404).json({ error: 'Paid file not found' });

        const file = rows[0];

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: { name: file.title },
                    unit_amount: Math.round(file.price * 100),
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/download/${file.slug}?success=true`,
            cancel_url: `${process.env.FRONTEND_URL}/download/${file.slug}?cancelled=true`,
            metadata: { file_id: file.id, user_id: req.user.id },
        });

        // Create pending order
        await db.query(
            'INSERT INTO orders (id, user_id, file_id, amount, stripe_payment_id) VALUES ($1,$2,$3,$4,$5)',
            [uuidv4(), req.user.id, file.id, file.price, session.id]
        );

        res.json({ checkout_url: session.url });
    } catch (err) {
        res.status(500).json({ error: 'Checkout failed', details: err.message });
    }
};

// POST /api/payments/webhook
const stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch {
        return res.status(400).json({ error: 'Webhook signature invalid' });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        await db.query(
            'UPDATE orders SET status = $1 WHERE stripe_payment_id = $2',
            ['completed', session.id]
        );
    }

    res.json({ received: true });
};

// GET /api/payments/orders
const getOrders = async (req, res) => {
    try {
        const { rows } = await db.query(
            `SELECT o.*, f.title AS file_title, f.slug AS file_slug
             FROM orders o JOIN files f ON o.file_id = f.id
             WHERE o.user_id = $1 ORDER BY o.created_at DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

module.exports = { createCheckout, stripeWebhook, getOrders };
