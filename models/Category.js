const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        enum: ['Beds', 'Windows', 'Doors', 'Chairs', 'Dining Tables']
    },
    icon: {
        type: String // We can store an icon class or path
    }
});

module.exports = mongoose.model('Category', categorySchema);
