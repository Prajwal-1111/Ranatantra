import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(express.json());
app.use(cors());

// Simple request logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Persistent JSON database to store Orders
const DB_FILE = path.resolve('./backend/orders.json');
let ordersDB = {};
try {
    if (fs.existsSync(DB_FILE)) {
        ordersDB = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    }
} catch (e) {
    console.warn("Could not read orders.json, starting fresh.");
}

const saveDB = () => {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(ordersDB, null, 2), 'utf-8');
    } catch (err) {
        console.error("Failed to save DB:", err);
    }
};

// Server-side event fee map (single source of truth for pricing)
const EVENT_FEES = {
    e1: 1, e2: 1, e3: 1, e4: 1, e5: 1,
    e6: 1, e7: 1, e8: 1, e9: 1, e10: 1,
    e11: 1, e12: 1, e13: 1, e14: 1, e15: 1,
};

/**
 * 1. CREATE ORDER
 * Calculates the amount server-side from selected event IDs to prevent tampering.
 */
app.post('/api/create-order', async (req, res) => {
    try {
        const { selectedEventIds, currency, email, phone, name } = req.body;

        // Validate event IDs and calculate total fee server-side
        if (!Array.isArray(selectedEventIds) || selectedEventIds.length === 0) {
            return res.status(400).json({ success: false, error: 'No events selected.' });
        }

        let totalFee = 0;
        const validEvents = [];
        for (const eventId of selectedEventIds) {
            const fee = EVENT_FEES[eventId];
            if (fee !== undefined) {
                totalFee += fee;
                validEvents.push(eventId);
            }
        }

        if (totalFee <= 0 || validEvents.length === 0) {
            return res.status(400).json({ success: false, error: 'Invalid events or zero fee.' });
        }

        const orderOptions = {
            amount: totalFee * 100, // Amount in paise
            currency: currency || 'INR',
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(orderOptions);

        // Save order to DB
        ordersDB[order.id] = {
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            status: 'CREATED',
            selectedEvents: validEvents,
            customerDetails: { email, phone, name }
        };
        saveDB();

        res.json({
            success: true,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            calculatedFee: totalFee
        });
    } catch (error) {
        console.error("Order Creation Error:", error);
        res.status(500).json({ success: false, error: 'Failed to create order' });
    }
});

/**
 * 2. VERIFY PAYMENT (Frontend Callback)
 * After Razorpay popup returns success, the frontend calls this securely.
 */
app.post('/api/verify-payment', (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Find the exact order we logged previously
    const order = ordersDB[razorpay_order_id];
    if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Cryptographically verify the signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
        // Payment is verified!
        order.status = 'PAID';
        order.paymentId = razorpay_payment_id;
        saveDB();

        // TODO: Send automatic Email Invoice here via a mailer like Nodemailer

        res.json({ success: true, message: 'Payment verified successfully' });
    } else {
        order.status = 'FAILED_VERIFICATION';
        saveDB();
        res.status(400).json({ success: false, message: 'Invalid payment signature!' });
    }
});

/**
 * 3. WEBHOOK RECEIVER (Absolute source of truth)
 * Listens for Razorpay's direct server-to-server pings.
 */
app.post('/api/webhook/razorpay', (req, res) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    // Verify Webhook Signature
    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');

    if (expectedSignature === signature) {
        const event = req.body.event;
        const paymentEntity = req.body.payload.payment.entity;
        const orderId = paymentEntity.order_id;

        // Idempotency: Always find the active order in our database
        const order = ordersDB[orderId];

        if (order) {
            if (event === 'payment.captured') {
                order.status = 'PAID';
                order.paymentId = paymentEntity.id;
                console.log(`Webhook: Order ${orderId} PAID successfully.`);
                saveDB();
                // TODO: Generate Invoice
            }
            else if (event === 'payment.failed') {
                order.status = 'FAILED';
                order.failureReason = paymentEntity.error_description;
                console.log(`Webhook: Order ${orderId} FAILED. Reason: ${order.failureReason}`);
                saveDB();
            }
        }
        // Always return 200 OK so Razorpay knows we received it
        res.status(200).json({ status: 'ok' });
    } else {
        res.status(400).json({ error: 'Invalid webhook signature' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend Sever running aggressively on port ${PORT}`));
