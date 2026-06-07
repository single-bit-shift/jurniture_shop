const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const { admin } = require('../middleware/admin');
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');


// @route   GET /api/products
// @desc    Get all products, filter by category and search
router.get('/', async (req, res) => {
    try {
        const { category, search } = req.query;
        let query = {};

        if (category) {
            query.category = category;
        }
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const products = await Product.find(query);
        res.json({ success: true, data: products });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @route   GET /api/products/:id
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
        res.json({ success: true, data: product });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @route   POST /api/products
// @access  Admin
router.post('/', protect, admin, upload.single('image'), async (req, res) => {
    try {
        const newProduct = { ...req.body };
        // Remove imageUrl from the data (it's our fallback field name)
        delete newProduct.imageUrl;

        if (req.file) {
            // File uploaded — send to Cloudinary
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'products' },
                async (error, result) => {
                    if (error) {
                        return res.status(500).json({ success: false, error: 'Upload failed' });
                    }
                    newProduct.image = result.secure_url;
                    const product = await Product.create(newProduct);
                    res.status(201).json({ success: true, data: product });
                }
            );
            stream.end(req.file.buffer);
        } else {
            // No file — use imageUrl field as fallback
            if (req.body.imageUrl) newProduct.image = req.body.imageUrl;
            const product = await Product.create(newProduct);
            res.status(201).json({ success: true, data: product });
        }

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @route   PUT /api/products/:id
// @access  Admin
router.put('/:id', protect, admin, upload.single('image'), async (req, res) => {
    try {
        const updateData = { ...req.body };
        delete updateData.imageUrl;

        if (req.file) {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'products' },
                async (error, result) => {
                    if (error) {
                        return res.status(500).json({ success: false, error: 'Upload failed' });
                    }
                    updateData.image = result.secure_url;
                    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
                    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
                    res.json({ success: true, data: product });
                }
            );
            stream.end(req.file.buffer);
        } else {
            if (req.body.imageUrl) updateData.image = req.body.imageUrl;
            const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
            if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
            res.json({ success: true, data: product });
        }

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// @route   DELETE /api/products/:id
// @access  Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
        res.json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
