const express = require('express');
const router = express.Router();
const Inquiry = require('../models/Inquiry');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

// @route   POST /api/inquiries
// @desc    Customer submits a new inquiry (auth protected)
router.post('/', protect, async (req, res) => {
    try {
        const { productId, productName, message } = req.body;
        const newInquiry = await Inquiry.create({
            userId: req.user._id,
            productId,
            productName,
            message
        });
        res.status(201).json({ success: true, data: newInquiry });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @route   GET /api/inquiries
// @desc    Admin views all inquiries (admin protected)
router.get('/', protect, admin, async (req, res) => {
    try {
        const inquiries = await Inquiry.find({})
            .populate('userId', 'name email')
            .populate('productId', 'name')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: inquiries });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
