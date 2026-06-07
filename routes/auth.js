const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { protect } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../utils/emailService');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// ==========================================
// @route   POST /api/auth/register
// ==========================================
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({
                success: false,
                error: 'User already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            isAdmin: false // Set to false so new registrations are customers, not admins
        });

        // Send welcome email (fire-and-forget, non-blocking)
        sendWelcomeEmail(user.name, user.email).catch(() => {});

        res.status(201).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin
            },
            token: generateToken(user._id)
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// ==========================================
// @route   POST /api/auth/login (normal user)
// ==========================================
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                success: true,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    isAdmin: user.isAdmin
                },
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// ==========================================
// @route   POST /api/auth/admin-login
// ==========================================
router.post('/admin-login', async (req, res) => {
    const { email, password, passkey } = req.body;

    try {
        // 🔐 Passkey check
        if (passkey !== process.env.ADMIN_PASSKEY) {
            return res.status(401).json({
                success: false,
                error: 'Invalid passkey'
            });
        }

        const user = await User.findOne({ email });

        if (user && user.isAdmin && (await user.matchPassword(password))) {
            res.json({
                success: true,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    isAdmin: user.isAdmin
                },
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({
                success: false,
                error: 'Invalid admin credentials'
            });
        }

    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// ==========================================
// @route   PUT /api/auth/change-password
// ==========================================
router.put('/change-password', protect, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const isMatch = await user.matchPassword(currentPassword);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                error: 'Incorrect current password'
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

module.exports = router;