const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');

// @route   GET /api/categories
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find();
        res.json({ success: true, data: categories });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @route   POST /api/categories
// @access  Admin
router.post('/', protect, admin, async (req, res) => {
    try {
        const category = await Category.create(req.body);
        res.status(201).json({ success: true, data: category });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @route   DELETE /api/categories/:id
// @access  Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) return res.status(404).json({ success: false, error: 'Category not found' });
        res.json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
