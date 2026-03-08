import crypto from 'crypto';

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
            return res.status(500).json({ success: false, message: 'Payment gateway not configured.' });
        }

        const { order_id } = req.body;

        if (!order_id) {
            return res.status(400).json({ success: false, message: 'Missing order_id' });
        }

        const response = await fetch(`https://api.cashfree.com/pg/orders/${order_id}`, {
            method: 'GET',
            headers: {
                'x-api-version': '2023-08-01',
                'x-client-id': appId,
                'x-client-secret': secretKey
            }
        });

        const data = await response.json();

        if (response.ok && data.order_status === 'PAID') {
            return res.json({ success: true, message: 'Payment verified successfully' });
        } else {
            return res.status(400).json({ success: false, message: 'Payment not completed or failed!', status: data.order_status });
        }
    } catch (error) {
        console.error('Verification Error:', error);
        return res.status(500).json({ success: false, message: 'Verification failed: ' + error.message });
    }
}
