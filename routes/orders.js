const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');
const { sendOrderConfirmation, sendOrderStatusUpdate } = require('../utils/emailService');
const { generateInvoice } = require('../utils/invoiceGenerator');

// @route   POST /api/orders
// @desc    Customer places an order (auth protected)
router.post('/', protect, async (req, res) => {
    try {
        const { items, totalAmount, deliveryAddress } = req.body;

        // Pre-checkout stock validation
        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ success: false, error: `Product "${item.name}" not found.` });
            }

            if (product.stock === 'Out of Stock') {
                return res.status(400).json({ success: false, error: `Product "${product.name}" is out of stock.` });
            }

            if (product.stock === 'In Stock') {
                const availableQuantity = product.quantity !== undefined ? product.quantity : 10;
                if (availableQuantity < item.quantity) {
                    return res.status(400).json({
                        success: false,
                        error: `Only ${availableQuantity} units of "${product.name}" are available in stock.`
                    });
                }
            }
        }

        // Create the order
        const newOrder = await Order.create({
            userId: req.user._id,
            items,
            totalAmount,
            deliveryAddress
        });

        // Decrement stock counts
        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (product && product.stock === 'In Stock') {
                const currentQty = product.quantity !== undefined ? product.quantity : 10;
                let newQty = currentQty - item.quantity;
                if (newQty <= 0) {
                    newQty = 0;
                    product.stock = 'Out of Stock';
                }
                product.quantity = newQty;
                await product.save();
            }
        }

        // Send order confirmation email (fire-and-forget, non-blocking)
        const user = await User.findById(req.user._id);
        if (user) {
            sendOrderConfirmation(newOrder, user.email, user.name).catch(() => {});
        }

        res.status(201).json({ success: true, data: newOrder });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @route   GET /api/orders/my
// @desc    Customer views their own orders (auth protected)
router.get('/my', protect, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @route   GET /api/orders/:id/invoice
// @desc    Download PDF invoice for an order (owner or admin)
router.get('/:id/invoice', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('userId', 'name email');

        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        // Authorization: only the order owner or an admin can download
        const isOwner = order.userId && order.userId._id.toString() === req.user._id.toString();
        const isAdminUser = req.user.isAdmin;

        if (!isOwner && !isAdminUser) {
            return res.status(403).json({ success: false, error: 'Not authorized to access this invoice' });
        }

        const user = order.userId || { name: order.deliveryAddress.fullName, email: '' };

        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="Invoice-${order.orderId}.pdf"`);

        const doc = generateInvoice(order, user);
        doc.pipe(res);
        doc.end();

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @route   GET /api/orders
// @desc    Admin views all orders (admin protected)
router.get('/', protect, admin, async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status) {
            query.status = status;
        }
        const orders = await Order.find(query).populate('userId', 'name email').sort({ createdAt: -1 });
        res.json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @route   PUT /api/orders/:id/status
// @desc    Admin updates order status (admin protected)
router.put('/:id/status', protect, admin, async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { returnDocument: 'after', runValidators: true }
        ).populate('userId', 'name email');

        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        // Send status update email (fire-and-forget, non-blocking)
        if (order.userId && order.userId.email) {
            sendOrderStatusUpdate(order, order.userId.email, order.userId.name, status).catch(() => {});
        }

        res.json({ success: true, data: order });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
