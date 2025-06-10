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
    .then(() => {
        console.log('MongoDB connection established successfully!');
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

module.exports = { mongoose, connectPromise };
