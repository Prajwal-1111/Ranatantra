import Razorpay from 'razorpay';

const EVENT_FEES = {
    e1: 1, e2: 1, e3: 1, e4: 1, e5: 1,
    e6: 1, e7: 1, e8: 1, e9: 1, e10: 1,
    e11: 1, e12: 1, e13: 1, e14: 1, e15: 1,
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    try {
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const { selectedEventIds, currency } = req.body;

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

        const order = await razorpay.orders.create({
            amount: totalFee * 100,
            currency: currency || 'INR',
            receipt: 'receipt_' + Date.now(),
        });

        return res.json({
            success: true,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            calculatedFee: totalFee,
        });
    } catch (error) {
        console.error('Order Creation Error:', error);
        return res.status(500).json({ success: false, error: 'Failed to create order: ' + error.message });
    }
}
