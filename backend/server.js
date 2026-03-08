import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const app = express();
// Keep raw body for webhook verification if needed
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}));
app.use(cors());

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

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

const EVENT_FEES = { e1: 1000, e2: 1000, e3: 1000 };

app.post('/api/create-order', async (req, res) => {
    try {
        const { selectedEventIds, currency, email, phone, name } = req.body;

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

        const orderId = 'order_' + Date.now() + Math.random().toString(36).substring(2, 6);
        const appId = process.env.CASHFREE_APP_ID;
        const secretKey = process.env.CASHFREE_SECRET_KEY;

        const payload = {
            order_amount: totalFee,
            order_currency: currency || 'INR',
            order_id: orderId,
            customer_details: {
                customer_id: 'cust_' + Date.now(),
                customer_phone: phone || '9999999999',
                customer_name: name || 'Participant',
                customer_email: email || 'participant@example.com'
            },
            order_meta: {
                return_url: `https://ranatantra.online/payment-status?order_id={order_id}`
            }
        };

        const response = await fetch('https://api.cashfree.com/pg/orders', {
            method: 'POST',
            headers: {
                'x-api-version': '2023-08-01',
                'x-client-id': appId,
                'x-client-secret': secretKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to create Cashfree order');
        }

        ordersDB[orderId] = {
            orderId: orderId,
            amount: totalFee,
            currency: currency || 'INR',
            status: 'CREATED',
            selectedEvents: validEvents,
            customerDetails: { email, phone, name }
        };
        saveDB();

        res.json({
            success: true,
            order_id: orderId,
            payment_session_id: data.payment_session_id,
            amount: totalFee,
            currency: data.order_currency
        });
    } catch (error) {
        console.error("Order Creation Error:", error);
        res.status(500).json({ success: false, error: 'Failed to create order' });
    }
});

app.post('/api/verify-payment', async (req, res) => {
    try {
        const { order_id } = req.body;
        const order = ordersDB[order_id];
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const appId = process.env.CASHFREE_APP_ID;
        const secretKey = process.env.CASHFREE_SECRET_KEY;

        const response = await fetch(`https://api.cashfree.com/pg/orders/${order_id}`, {
            headers: {
                'x-api-version': '2023-08-01',
                'x-client-id': appId,
                'x-client-secret': secretKey
            }
        });

        const data = await response.json();

        if (response.ok && data.order_status === 'PAID') {
            order.status = 'PAID';
            order.paymentId = order_id;
            saveDB();
            return res.json({ success: true, message: 'Payment verified successfully' });
        } else {
            order.status = 'FAILED_VERIFICATION';
            saveDB();
            return res.status(400).json({ success: false, message: 'Payment not completed or failed!' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Verification failed: ' + error.message });
    }
});

app.post('/api/webhook/cashfree', (req, res) => {
    try {
        const ts = req.headers["x-webhook-timestamp"];
        const signature = req.headers["x-webhook-signature"];
        const secretKey = process.env.CASHFREE_SECRET_KEY;

        const expectedSignature = crypto.createHmac('sha256', secretKey)
            .update(ts + req.rawBody)
            .digest('base64');

        if (expectedSignature === signature) {
            const event = req.body.type;
            const orderId = req.body.data?.order?.order_id;
            const order = ordersDB[orderId];

            if (order) {
                if (event === 'PAYMENT_SUCCESS_WEBHOOK') {
                    order.status = 'PAID';
                    saveDB();
                } else if (event === 'PAYMENT_FAILED_WEBHOOK') {
                    order.status = 'FAILED';
                    saveDB();
                }
            }
            res.status(200).send('OK');
        } else {
            res.status(400).send('Invalid signature');
        }
    } catch (e) {
        res.status(500).send('Error processing webhook');
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend Server running on port ${PORT}`));
