require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
app.use(express.json());


// CRITICAL: This MUST be the exact same secret key used in your API_Gateway
const JWT_SECRET = process.env.JWT_SECRET;

const PersonModel = require('./person_schema.js');
const dbconnect = require('./dbconnect.js');
const {
    generateSuccessHTML,
    invalidCredentialsHTML,
    dbErrorHTML,
    missingFieldsHTML
} = require('./authUI.js');
// The Login API Endpoint - now using async/await and properly secured
app.post("/login", async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    console.log("Login attempt for:", email);

    // Check for missing fields
    if (!email || !password) {
        console.error("Login error: Missing email or password");
        res.status(400).send(missingFieldsHTML());
        return;
    }

    try {
        // Find a user that matches emailid AND password
        const foundUser = await PersonModel.findOne({
            emailid: email,
            pass: password
        });

        if (foundUser) {
            // The role is taken from the DATABASE (foundUser.role), NOT the request body.
            const token = jwt.sign(
                {
                    email: foundUser.emailid || foundUser.email,
                    role: foundUser.role
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            // Send back the hyped-up HTML page
            const htmlResponse = generateSuccessHTML(token);
            res.status(200).send(htmlResponse);
        } else {
            // If no document matches, send an error HTML
            console.error(`Login error: Invalid credentials for email ${email}`);
            res.status(401).send(invalidCredentialsHTML());
        }
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).send(dbErrorHTML(err.message));
    }
});

app.listen(5002, () => console.log('Authentication Service running securely on PORT 5002'));