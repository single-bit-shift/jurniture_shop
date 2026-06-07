const PDFDocument = require('pdfkit');

/**
 * Generates a professional invoice PDF for an order.
 * @param {Object} order - The order document (with items, deliveryAddress, etc.)
 * @param {Object} user - The user object { name, email }
 * @returns {PDFDocument} A readable stream of the PDF
 */
function generateInvoice(order, user) {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    const primaryColor = '#864f00';
    const darkColor = '#1b1c1b';
    const mutedColor = '#847466';
    const borderColor = '#d6c3b2';
    const bgColor = '#f4f3f1';

    const pageWidth = doc.page.width - 100; // 50 margin on each side

    // ── HEADER BAND ─────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 100).fill('#2f3130');

    doc.font('Helvetica-Bold')
        .fontSize(24)
        .fillColor(primaryColor)
        .text('TEAK & TIMBER', 50, 30, { width: pageWidth / 2 });

    doc.font('Helvetica')
        .fontSize(8)
        .fillColor('#d6c3b2')
        .text('PALAMOOTTIL WOOD INDUSTRIES & FURNITURE', 50, 60, { width: pageWidth / 2 });

    // Invoice label (right side)
    doc.font('Helvetica-Bold')
        .fontSize(28)
        .fillColor('#ffffff')
        .text('INVOICE', 350, 30, { width: 200, align: 'right' });

    doc.font('Helvetica')
        .fontSize(9)
        .fillColor('#d6c3b2')
        .text(`#${order.orderId}`, 350, 65, { width: 200, align: 'right' });

    // ── META INFO ROW ───────────────────────────────────────────
    let y = 120;

    // Left column: Order details
    doc.font('Helvetica-Bold').fontSize(8).fillColor(mutedColor)
        .text('ORDER DATE', 50, y);
    doc.font('Helvetica').fontSize(10).fillColor(darkColor)
        .text(new Date(order.createdAt).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric'
        }), 50, y + 14);

    doc.font('Helvetica-Bold').fontSize(8).fillColor(mutedColor)
        .text('STATUS', 200, y);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(primaryColor)
        .text(order.status.toUpperCase(), 200, y + 14);

    doc.font('Helvetica-Bold').fontSize(8).fillColor(mutedColor)
        .text('PAYMENT', 350, y);
    doc.font('Helvetica').fontSize(10).fillColor(darkColor)
        .text('Cash on Delivery', 350, y + 14);

    // ── DIVIDER ─────────────────────────────────────────────────
    y = 160;
    doc.moveTo(50, y).lineTo(50 + pageWidth, y).strokeColor(borderColor).lineWidth(1.5).stroke();

    // ── BILLED TO / SHIPPED TO ──────────────────────────────────
    y = 175;

    doc.font('Helvetica-Bold').fontSize(8).fillColor(mutedColor)
        .text('BILLED TO', 50, y);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(darkColor)
        .text(user.name || order.deliveryAddress.fullName, 50, y + 14);
    doc.font('Helvetica').fontSize(9).fillColor(mutedColor)
        .text(user.email, 50, y + 28);

    doc.font('Helvetica-Bold').fontSize(8).fillColor(mutedColor)
        .text('SHIP TO', 300, y);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(darkColor)
        .text(order.deliveryAddress.fullName, 300, y + 14);
    doc.font('Helvetica').fontSize(9).fillColor(mutedColor)
        .text(order.deliveryAddress.address, 300, y + 28);
    doc.font('Helvetica').fontSize(9).fillColor(mutedColor)
        .text(`${order.deliveryAddress.city} - ${order.deliveryAddress.pincode}`, 300, y + 42);
    doc.font('Helvetica').fontSize(9).fillColor(mutedColor)
        .text(`Phone: ${order.deliveryAddress.phone}`, 300, y + 56);

    // ── DIVIDER ─────────────────────────────────────────────────
    y = 255;
    doc.moveTo(50, y).lineTo(50 + pageWidth, y).strokeColor(borderColor).lineWidth(1.5).stroke();

    // ── ITEMS TABLE HEADER ──────────────────────────────────────
    y = 270;
    const colX = { item: 50, qty: 320, price: 390, total: 470 };

    // Table header background
    doc.rect(50, y - 4, pageWidth, 22).fill(bgColor);
    doc.font('Helvetica-Bold').fontSize(8).fillColor(mutedColor);
    doc.text('ITEM', colX.item + 8, y + 2);
    doc.text('QTY', colX.qty, y + 2, { width: 50, align: 'center' });
    doc.text('PRICE', colX.price, y + 2, { width: 60, align: 'right' });
    doc.text('SUBTOTAL', colX.total, y + 2, { width: 75, align: 'right' });

    // ── ITEMS ROWS ──────────────────────────────────────────────
    y = 296;
    doc.font('Helvetica').fontSize(10);

    order.items.forEach((item, i) => {
        const rowY = y + (i * 28);
        const itemTotal = item.price * item.quantity;

        // Alternating row background
        if (i % 2 === 0) {
            doc.rect(50, rowY - 4, pageWidth, 24).fill('#faf9f7');
        }

        doc.fillColor(darkColor)
            .text(item.name, colX.item + 8, rowY + 2, { width: 250 });
        doc.fillColor(darkColor)
            .text(item.quantity.toString(), colX.qty, rowY + 2, { width: 50, align: 'center' });
        doc.fillColor(darkColor)
            .text(`₹${item.price.toLocaleString('en-IN')}`, colX.price, rowY + 2, { width: 60, align: 'right' });
        doc.fillColor(primaryColor)
            .text(`₹${itemTotal.toLocaleString('en-IN')}`, colX.total, rowY + 2, { width: 75, align: 'right' });
    });

    // ── TOTAL ROW ───────────────────────────────────────────────
    y = y + (order.items.length * 28) + 10;
    doc.moveTo(350, y).lineTo(50 + pageWidth, y).strokeColor(borderColor).lineWidth(1.5).stroke();

    y += 10;
    doc.font('Helvetica-Bold').fontSize(12).fillColor(darkColor)
        .text('TOTAL AMOUNT', 350, y, { width: 100 });
    doc.font('Helvetica-Bold').fontSize(16).fillColor(primaryColor)
        .text(`₹${order.totalAmount.toLocaleString('en-IN')}`, colX.total, y - 2, { width: 75, align: 'right' });

    // ── FOOTER BAND ─────────────────────────────────────────────
    const footerY = doc.page.height - 80;

    doc.rect(0, footerY, doc.page.width, 80).fill('#2f3130');

    doc.font('Helvetica').fontSize(9).fillColor('#847466')
        .text('Palamoottil Wood Industries and Furniture · Pathanamthitta, Kerala',
            50, footerY + 20, { width: pageWidth, align: 'center' });

    const phone = process.env.BUSINESS_PHONE || '';
    if (phone) {
        doc.font('Helvetica').fontSize(8).fillColor('#847466')
            .text(`Contact: ${phone}`, 50, footerY + 38, { width: pageWidth, align: 'center' });
    }

    doc.font('Helvetica').fontSize(7).fillColor('#524438')
        .text('Thank you for your purchase! This is a computer-generated invoice.',
            50, footerY + 55, { width: pageWidth, align: 'center' });

    return doc;
}

module.exports = { generateInvoice };
