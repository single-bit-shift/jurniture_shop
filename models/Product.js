const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    material: {
        type: String
    },
    dimensions: {
        type: String
    },
    stock: {
        type: String,
        enum: ['In Stock', 'Out of Stock', 'Made to Order'],
        default: 'In Stock'
    },
    image: {
        type: String // URL or path to image
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Product', productSchema);
