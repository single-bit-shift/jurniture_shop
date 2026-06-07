const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const User = require('./models/User');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB...');

        const user = await User.findOne({ email: 'raju@mail.com' });
        if (user) {
            console.log(`Found user: ${user.name} (${user.email}) - isAdmin: ${user.isAdmin}`);
            if (user.isAdmin) {
                user.isAdmin = false;
                await user.save();
                console.log('Successfully set isAdmin to false for raju@mail.com');
            } else {
                console.log('User raju@mail.com already has isAdmin = false');
            }
        } else {
            console.log('User raju@mail.com not found in the database');
        }

        // Also check if there are other customer accounts that were mistakenly created as admin
        const otherAdmins = await User.find({ email: { $ne: 'admin@teaktimber.com' }, isAdmin: true });
        if (otherAdmins.length > 0) {
            console.log(`Found ${otherAdmins.length} other administrative account(s) registered during development.`);
            for (let u of otherAdmins) {
                u.isAdmin = false;
                await u.save();
                console.log(`Set isAdmin to false for: ${u.email}`);
            }
        }

    } catch (err) {
        console.error('Error running script:', err);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed.');
    }
};

run();
