const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true,
        default: () => 'ORD-' + Math.floor(100000 + Math.random() * 900000)
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    deliveryAddress: {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        pincode: { type: String, required: true }
    },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Ready for Delivery', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', orderSchema);
