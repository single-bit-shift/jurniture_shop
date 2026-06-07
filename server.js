const dotenv = require('dotenv');
// Load environment variables FIRST before any other imports
dotenv.config();

const express = require('express');
const path = require('path');
const connectDB = require('./config/db');
const Category = require('./models/Category');
const User = require('./models/User');
const upload = require('./middleware/upload');
const cloudinary = require('./config/cloudinary');


const seedData = async () => {
    try {
        const categories = await Category.find();
        if (categories.length === 0) {
            await Category.insertMany([
                { name: 'Beds', icon: 'fas fa-bed' },
                { name: 'Windows', icon: 'fas fa-border-all' },
                { name: 'Doors', icon: 'fas fa-door-closed' },
                { name: 'Chairs', icon: 'fas fa-chair' },
                { name: 'Dining Tables', icon: 'fas fa-table' }
            ]);
            console.log('Categories seeded.');
        }

        const admin = await User.findOne({ email: 'admin@teaktimber.com' });
        if (!admin) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await User.create({
                name: 'Admin',
                email: 'admin@teaktimber.com',
                password: hashedPassword,
                isAdmin: true
            });
            console.log('Admin user seeded.');
        }

        // Seed test customer users
        const bcrypt = require('bcryptjs');

        const testUser1 = await User.findOne({ email: 'grimreaperr2255@gmail.com' });
        if (!testUser1) {
            const hashed = await bcrypt.hash('user123', 10);
            await User.create({
                name: 'Grim Reaper',
                email: 'grimreaperr2255@gmail.com',
                password: hashed,
                isAdmin: false
            });
            console.log('Test user grimreaperr2255@gmail.com seeded.');
        }

        const testUser2 = await User.findOne({ email: 'the.hypercharged@gmail.com' });
        if (!testUser2) {
            const hashed = await bcrypt.hash('user123', 10);
            await User.create({
                name: 'Hypercharged',
                email: 'the.hypercharged@gmail.com',
                password: hashed,
                isAdmin: false
            });
            console.log('Test user the.hypercharged@gmail.com seeded.');
        }
    } catch (err) {
        console.error('Data seeding error:', err);
    }
};

// Connect to the database
connectDB().then(() => {
    seedData();
});

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve frontend from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/inquiries', require('./routes/inquiries'));

// Catch-all route to serve the home page
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
