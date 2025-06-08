// The NEW and IMPROVED dbconnect.js
const mongoose = require('mongoose');

const uri = "URL";

const clientOptions = {
    serverApi: { version: '1', strict: true, deprecationErrors: true }
};

// This is the standard way to connect for an Express server
mongoose.connect(uri, clientOptions)
    .then(() => {
        console.log("MongoDB connection established successfully!");
    })
    .catch(err => {
        console.error("MongoDB connection error:", err);
        process.exit(1); // Exit the process with an error code if we can't connect
    });

// You can still listen for events if you want
mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected.');
});

// Export the mongoose object. It will now manage the connection pool for you.
module.exports = mongoose;
