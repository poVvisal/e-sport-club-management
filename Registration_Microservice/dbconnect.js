require('dotenv').config();
const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error('MONGODB_URI is not defined in .env file');
    process.exit(1);
}

const clientOptions = {
    serverApi: { version: '1', strict: true, deprecationErrors: true }
};

const connectPromise = mongoose.connect(uri, clientOptions)
    .then(async () => {
        console.log('MongoDB connection established successfully!');
        // Run admin command to verify admin access
        const admin = mongoose.connection.db.admin();
        const result = await admin.command({ ping: 1 });
        console.log('Admin ping result:', result);
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

module.exports = { mongoose, connectPromise };
