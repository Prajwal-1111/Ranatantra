const EVENT_FEES = {
    e1: 10, e2: 10, e3: 10, e4: 10, e5: 10,
    e6: 10, e7: 10, e8: 10, e9: 10, e10: 10,
    e11: 10, e12: 10, e13: 10, e14: 10, e15: 10,
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    try {
        const appId = process.env.CASHFREE_APP_ID;
        const secretKey = process.env.CASHFREE_SECRET_KEY;

        if (!appId || !secretKey) {
            return res.status(500).json({ success: false, error: 'Payment gateway not configured.' });
        }

        const { selectedEventIds, currency, email, phone, name } = req.body;

        if (!Array.isArray(selectedEventIds) || selectedEventIds.length === 0) {
            return res.status(400).json({ success: false, error: 'No events selected.' });
        }

        // Flat bundle fee — all events included for ₹10
        const totalFee = 10;
        const validEvents = selectedEventIds;

        const orderId = 'order_' + Date.now() + Math.random().toString(36).substring(2, 6);

        const payload = {
            order_amount: totalFee,
            order_currency: currency || 'INR',
            order_id: orderId,
            customer_details: {
                customer_id: 'cust_' + Date.now(),
                customer_phone: (phone || '9999999999').replace(/[^0-9+]/g, ''),
                customer_name: name || 'Ranatantra Participant',
                customer_email: email || 'participant@ranatantra.online'
            },
            order_meta: {
                // Ensure returning to the same site/page if redirected
                // The frontend handles checkout so return_url is needed for some flows
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

        return res.json({
            success: true,
            order_id: data.order_id,
            payment_session_id: data.payment_session_id,
            amount: totalFee,
            currency: data.order_currency,
        });
    } catch (error) {
        console.error('Order Creation Error:', error);
        return res.status(500).json({ success: false, error: 'Failed to create order: ' + error.message });
    }
}
