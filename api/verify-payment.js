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

        const { order_id, registrationData } = req.body;

        if (!order_id) {
            return res.status(400).json({ success: false, message: 'Missing order_id' });
        }

        // Step 1: Verify payment with Cashfree
        const response = await fetch(`https://api.cashfree.com/pg/orders/${order_id}`, {
            method: 'GET',
            headers: {
                'x-api-version': '2023-08-01',
                'x-client-id': appId,
                'x-client-secret': secretKey
            }
        });

        const data = await response.json();

        if (!response.ok || data.order_status !== 'PAID') {
            return res.status(400).json({ success: false, message: 'Payment not completed or failed!', status: data.order_status });
        }

        // Step 2: After payment verified, submit registration to Google Sheet
        let sheetResult = { status: 'skipped' };
        if (registrationData) {
            const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbywaC9GUipJs7O3d7-13mCNR7n6zzBO0uXK8b6ji3Vjo5KP0-gLcPw9eX-IaPqayND7/exec';

            const payload = {
                ...registrationData,
                paymentId: order_id,
                action: 'register'
            };

            try {
                const sheetResponse = await fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    redirect: 'follow'
                });

                const sheetText = await sheetResponse.text();
                try {
                    sheetResult = JSON.parse(sheetText);
                } catch {
                    // Google Apps Script may redirect — try to parse whatever we got
                    sheetResult = { status: 'success', message: 'Sheet submission sent (response not JSON)' };
                }

                console.log('Google Sheet submission result:', sheetResult);
            } catch (sheetError) {
                console.error('Google Sheet submission error:', sheetError);
                sheetResult = { status: 'error', message: sheetError.message || 'Failed to write to sheet' };
            }
        }

        return res.json({
            success: true,
            message: 'Payment verified successfully',
            sheetResult
        });
    } catch (error) {
        console.error('Verification Error:', error);
        return res.status(500).json({ success: false, message: 'Verification failed: ' + error.message });
    }
}
