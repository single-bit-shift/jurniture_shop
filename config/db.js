const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.log('MONGODB_URI not found in .env');
            return;
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error(`Error connecting to MongoDB: ${err.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
