require('dotenv').config()
const express = require('express');
const app = express();
const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer();
const jwt = require('jsonwebtoken');
const targets = require('./target.js');

const JWT_SECRET = process.env.JWT_SECRET;

const { generateErrorHTML, ApiGatewayErrors } = require('./apiUI.js');

// --- MIDDLEWARE 1: AUTHENTICATE THE TOKEN (NOW WITH HTML ERRORS) ---
function authToken(req, res, next) {
    console.log("authToken Middleware: Checking token...");
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        console.log("Token not found!");
        const html = generateErrorHTML(401, 'AUTHENTICATION REQUIRED', 'You need a security token to access this area.', 'Trying to sneak in without a pass? That\'s a bold move, ah lop. It didn\'t work.');
        return res.status(401).send(html);
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log("Invalid token!");
            const html = generateErrorHTML(403, 'INVALID TOKEN', 'The token you sent is expired, fake, or otherwise busted.', 'Is this token from a cereal box? Because it\'s not getting you anywhere. Try again.');
            return res.status(403).send(html);
        }
        req.user = user;
        console.log("Token is valid for user:", user);
        next();
    });
}

// --- MIDDLEWARE 2: AUTHORIZE THE ROLE (NOW WITH HTML ERRORS) ---
function authRole(role) {
    return (req, res, next) => {
        console.log(`authRole Middleware: Checking for role: '${role}'...`);
        if (req.user.role !== role) {
            console.log(`Role mismatch. User has role '${req.user.role}', needs '${role}'.`);
            const html = generateErrorHTML(403, 'UNAUTHORIZED ACCESS', `Your clearance level is '${req.user.role}', but this area requires '${role}'.`, 'This is the VIP section, not general admission. Nice try, though.');
            return res.status(403).send(html);
        }
        console.log("Role is authorized.");
        next();
    }
}


// --- ROUTING LOGIC: THE MAIN TRAFFIC COP ---

// >> Public Routes (No token needed) <<
app.use('/reg', (req, res) => {
    console.log("Routing to Registration Service...");
    proxy.web(req, res, { target: targets.REGISTRATION_SERVICE });
});

app.use('/auth', (req, res) => {
    console.log("Routing to Authentication Service...");
    proxy.web(req, res, { target: targets.REGISTRATION_SERVICE });
});

// >> Protected Routes (Token and Role are required) <<
app.use('/coach', authToken, authRole('coach'), (req, res) => {
    console.log("Routing to Coach Service...");
    proxy.web(req, res, { target: targets.COACH_SERVICE });
});

app.use('/player', authToken, authRole('player'), (req, res) => {
    console.log("Routing to Player Service...");
    proxy.web(req, res, { target: targets.PLAYER_SERVICE });
});

// !!! NEW ADMIN ROUTE, POINTING TO THE COACH SERVER !!!
// Requires 'admin' role
app.use('/admin', authToken, authRole('admin'), (req, res) => {
    console.log("Routing ADMIN request to Coach Service...");
    proxy.web(req, res, { target: targets.COACH_SERVICE });
});

// 404 handler for unmatched routes
app.use((req, res) => {
    res.status(404).send(ApiGatewayErrors.notFound());
});

// 500 handler for server errors
app.use((err, req, res, next) => {
    res.status(500).send(ApiGatewayErrors.internalError(err.message));
});

// Start the API Gateway server on Port 4000
app.listen(4000, () => console.log('API Gateway running on Port 4000'));