const https = require('https');

// Helper to send emails via Resend HTTP API
function sendEmailViaResend({ to, subject, html }) {
    return new Promise((resolve, reject) => {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            return reject(new Error('RESEND_API_KEY not found in environment variables.'));
        }

        const fromAddress = process.env.EMAIL_FROM || 'Teak & Timber <onboarding@resend.dev>';
        const payload = JSON.stringify({
            from: fromAddress,
            to: [to],
            subject: subject,
            html: html
        });

        const options = {
            hostname: 'api.resend.com',
            port: 443,
            path: '/emails',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsed);
                    } else {
                        reject(new Error(parsed.message || `Resend HTTP Error ${res.statusCode}`));
                    }
                } catch (e) {
                    reject(new Error(`Failed to parse Resend response (Status ${res.statusCode}): ${data}`));
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(payload);
        req.end();
    });
}


// ── Branded HTML Layout Wrapper ─────────────────────────────────
function wrapInTemplate(title, bodyContent) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { margin: 0; padding: 0; background-color: #faf9f7; font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; color: #1b1c1b; }
            .container { max-width: 600px; margin: 0 auto; padding: 0; }
            .header { background-color: #2f3130; padding: 24px 32px; text-align: center; }
            .header h1 { color: #864f00; font-size: 22px; margin: 0; letter-spacing: 3px; text-transform: uppercase; font-weight: 700; }
            .header p { color: #d6c3b2; font-size: 11px; margin: 6px 0 0 0; letter-spacing: 2px; text-transform: uppercase; }
            .body { background-color: #ffffff; padding: 32px; border-left: 1.5px solid #d6c3b2; border-right: 1.5px solid #d6c3b2; }
            .body h2 { color: #864f00; font-size: 18px; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; }
            .body p { font-size: 14px; line-height: 1.6; color: #524438; margin: 0 0 12px 0; }
            .divider { border: none; border-top: 1.5px solid #d6c3b2; margin: 20px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
            .info-label { color: #847466; text-transform: uppercase; letter-spacing: 1px; font-size: 11px; }
            .info-value { color: #1b1c1b; font-weight: 600; }
            .items-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            .items-table th { background-color: #efeeec; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #847466; border-bottom: 1.5px solid #d6c3b2; }
            .items-table td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #f4f3f1; color: #1b1c1b; }
            .total-row td { font-weight: 700; font-size: 15px; color: #864f00; border-top: 1.5px solid #d6c3b2; padding-top: 14px; }
            .status-badge { display: inline-block; padding: 6px 16px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; border: 2px solid; }
            .status-pending { border-color: #E65100; color: #E65100; background-color: #FFF3E0; }
            .status-confirmed { border-color: #1565C0; color: #1565C0; background-color: #E3F2FD; }
            .status-ready { border-color: #00897B; color: #00897B; background-color: #E0F2F1; }
            .status-delivered { border-color: #2E7D32; color: #2E7D32; background-color: #E8F5E9; }
            .status-cancelled { border-color: #C62828; color: #C62828; background-color: #FFEBEE; }
            .footer { background-color: #2f3130; padding: 20px 32px; text-align: center; }
            .footer p { color: #847466; font-size: 11px; margin: 0; letter-spacing: 1px; }
            .footer a { color: #a3671b; text-decoration: none; }
            .highlight-box { background-color: #f4f3f1; border: 1.5px solid #d6c3b2; padding: 16px 20px; margin: 16px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Teak &amp; Timber</h1>
                <p>Palamoottil Wood Industries &amp; Furniture</p>
            </div>
            <div class="body">
                <h2>${title}</h2>
                ${bodyContent}
            </div>
            <div class="footer">
                <p>Palamoottil Wood Industries and Furniture &middot; Pathanamthitta, Kerala</p>
                <p style="margin-top: 8px;">&copy; ${new Date().getFullYear()} Teak &amp; Timber. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>`;
}

// ── Helper: Status Badge CSS Class ──────────────────────────────
function getStatusClass(status) {
    const map = {
        'Pending': 'status-pending',
        'Confirmed': 'status-confirmed',
        'Ready for Delivery': 'status-ready',
        'Delivered': 'status-delivered',
        'Cancelled': 'status-cancelled'
    };
    return map[status] || 'status-pending';
}

// ══════════════════════════════════════════════════════════════════
// 1. ORDER CONFIRMATION EMAIL
// ══════════════════════════════════════════════════════════════════
async function sendOrderConfirmation(order, userEmail, userName) {
    const itemsHtml = order.items.map(item => `
        <tr>
            <td>${item.name}</td>
            <td style="text-align:center;">${item.quantity}</td>
            <td style="text-align:right;">₹${item.price.toLocaleString('en-IN')}</td>
            <td style="text-align:right;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
        </tr>
    `).join('');

    const body = `
        <p>Dear <strong>${userName}</strong>,</p>
        <p>Thank you for your order! We've received it and will begin processing it shortly.</p>

        <div class="highlight-box">
            <div class="info-row">
                <span class="info-label">Order ID</span>
                <span class="info-value">${order.orderId}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Date Placed</span>
                <span class="info-value">${new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Status</span>
                <span class="status-badge status-pending">Pending</span>
            </div>
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th style="text-align:center;">Qty</th>
                    <th style="text-align:right;">Price</th>
                    <th style="text-align:right;">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
                <tr class="total-row">
                    <td colspan="3" style="text-align:right;">Total Amount</td>
                    <td style="text-align:right;">₹${order.totalAmount.toLocaleString('en-IN')}</td>
                </tr>
            </tbody>
        </table>

        <hr class="divider">
        <p class="info-label" style="margin-bottom: 8px;">Delivery Address</p>
        <p>
            <strong>${order.deliveryAddress.fullName}</strong><br>
            ${order.deliveryAddress.address}<br>
            ${order.deliveryAddress.city} - ${order.deliveryAddress.pincode}<br>
            Phone: ${order.deliveryAddress.phone}
        </p>

        <hr class="divider">
        <p style="font-size: 12px; color: #847466;">Payment Method: <strong>Cash on Delivery (COD)</strong></p>
    `;

    try {
        await sendEmailViaResend({
            to: userEmail,
            subject: `Order Confirmed — ${order.orderId} | Teak & Timber`,
            html: wrapInTemplate('Order Confirmation', body)
        });
        console.log(`✅ Order confirmation email sent to ${userEmail}`);
    } catch (err) {
        console.error(`❌ Failed to send order confirmation email to ${userEmail}:`, err.message);
    }
}

// ══════════════════════════════════════════════════════════════════
// 2. ORDER STATUS UPDATE EMAIL
// ══════════════════════════════════════════════════════════════════
async function sendOrderStatusUpdate(order, userEmail, userName, newStatus) {
    const statusMessages = {
        'Confirmed': 'Your order has been confirmed and is being prepared.',
        'Ready for Delivery': 'Great news! Your order is packed and ready for delivery.',
        'Delivered': 'Your order has been delivered. We hope you love your new furniture!',
        'Cancelled': 'Your order has been cancelled. If you have questions, please contact us.'
    };

    const body = `
        <p>Dear <strong>${userName}</strong>,</p>
        <p>${statusMessages[newStatus] || `Your order status has been updated to <strong>${newStatus}</strong>.`}</p>

        <div class="highlight-box">
            <div class="info-row">
                <span class="info-label">Order ID</span>
                <span class="info-value">${order.orderId}</span>
            </div>
            <div class="info-row">
                <span class="info-label">New Status</span>
                <span class="status-badge ${getStatusClass(newStatus)}">${newStatus}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Total Amount</span>
                <span class="info-value">₹${order.totalAmount.toLocaleString('en-IN')}</span>
            </div>
        </div>

        <p>Items in this order:</p>
        <ul style="padding-left: 20px; margin: 8px 0;">
            ${order.items.map(i => `<li style="font-size: 13px; margin-bottom: 4px;">${i.name} × ${i.quantity}</li>`).join('')}
        </ul>

        <hr class="divider">
        <p style="font-size: 12px; color: #847466;">If you have any questions about your order, please reply to this email.</p>
    `;

    try {
        await sendEmailViaResend({
            to: userEmail,
            subject: `Order ${newStatus} — ${order.orderId} | Teak & Timber`,
            html: wrapInTemplate('Order Status Update', body)
        });
        console.log(`✅ Status update email sent to ${userEmail} — ${newStatus}`);
    } catch (err) {
        console.error(`❌ Failed to send status update email to ${userEmail}:`, err.message);
    }
}

// ══════════════════════════════════════════════════════════════════
// 3. WELCOME EMAIL
// ══════════════════════════════════════════════════════════════════
async function sendWelcomeEmail(userName, userEmail) {
    const body = `
        <p>Dear <strong>${userName}</strong>,</p>
        <p>Welcome to <strong>Teak &amp; Timber</strong> — your destination for premium handcrafted wood furniture!</p>
        <p>Your account has been created successfully. You can now:</p>
        <ul style="padding-left: 20px; margin: 12px 0;">
            <li style="font-size: 13px; margin-bottom: 6px;">Browse our curated collection of beds, doors, windows, chairs, and dining tables</li>
            <li style="font-size: 13px; margin-bottom: 6px;">Add items to your cart and place orders</li>
            <li style="font-size: 13px; margin-bottom: 6px;">Track your orders in real-time</li>
            <li style="font-size: 13px; margin-bottom: 6px;">Submit product inquiries for custom requirements</li>
        </ul>

        <div class="highlight-box">
            <div class="info-row">
                <span class="info-label">Account Email</span>
                <span class="info-value">${userEmail}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Member Since</span>
                <span class="info-value">${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
        </div>

        <p>We craft each piece with care using the finest teak wood from Kerala. Thank you for choosing us.</p>
        <hr class="divider">
        <p style="font-size: 12px; color: #847466;">This is an automated welcome message. Please do not reply.</p>
    `;

    try {
        await sendEmailViaResend({
            to: userEmail,
            subject: `Welcome to Teak & Timber, ${userName}!`,
            html: wrapInTemplate('Welcome Aboard', body)
        });
        console.log(`✅ Welcome email sent to ${userEmail}`);
    } catch (err) {
        console.error(`❌ Failed to send welcome email to ${userEmail}:`, err.message);
    }
}

module.exports = {
    sendOrderConfirmation,
    sendOrderStatusUpdate,
    sendWelcomeEmail
};
