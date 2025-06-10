require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json());

const dbconnect = require('./dbconnect.js');
const PersonModel = require('./person_schema.js');
const { generateHTMLResponse } = require('./regUI.js'); // <-- Add this import

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET; // <-- Add this line
app.use(express.json());



// Generate a unique ID
function uniqueid(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// Generate clean, readable email
function generateEmail(name, role) {
    const cleanName = name
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .join('.');
    return `${cleanName}.${role}@vainglory.com`;
}



// Generic registration handler
function registerUser(req, res, role) {
    console.log(`${role.toUpperCase()} REGISTRATION API EXECUTED`);

    const name = req.body.firstname;
    const email = generateEmail(name, role);

    const mobile = req.body.mobile;
    if (!/^\+?\d{10,15}$/.test(mobile)) {
        return res.status(400).send('<h3>Invalid mobile number format.</h3>');
    }

    const newUser = new PersonModel({
        id: uniqueid(1000, 9999),
        name: name,
        emailid: email,
        pass: req.body.password,
        mobile: mobile,
        role: role
    });

    newUser.save()
        .then(doc => {
            // Map doc.emailid to email for the HTML template
            const userForHtml = {
                id: doc.id,
                name: doc.name,
                email: doc.emailid, // <-- use the generated email
                mobile: doc.mobile,
                role: doc.role
            };
            const html = generateHTMLResponse(userForHtml);
            res.status(200).send(html);
        })
        .catch(err => {
            res.status(500).send(`<h3>Error in ${role} registration: ${err.message}</h3>`);
        });
}

// Coach registration
app.post('/coach', (req, res) => registerUser(req, res, 'coach'));

// Player registration
app.post('/player', (req, res) => registerUser(req, res, 'player'));

// Admin registration
app.post('/admin', (req, res) => registerUser(req, res, 'admin'));


//Authentication 
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






app.listen(5001, () => console.log('EXPRESS Server Started at Port No: 5001'));
