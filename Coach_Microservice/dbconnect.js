require('dotenv').config(); // Load environment variables from .env

const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.error('MONGODB_URI is not defined in .env file');
    process.exit(1);
}

const clientOptions = {
    serverApi: { version: '1', strict: true, deprecationErrors: true }
};

async function connectDB() {
    try {
        await mongoose.connect(uri, clientOptions);
        console.log('MongoDB connection established successfully!');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
}

// Handle disconnection
mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected. Attempting to reconnect...');
    setTimeout(connectDB, 5000); // Attempt to reconnect after 5 seconds
});

<<<<<<< HEAD
// Handle connection errors after initial connection
mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
// Handle connection errors after initial connection
mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

// Call the connection function
connectDB();

module.exports = mongoose;
