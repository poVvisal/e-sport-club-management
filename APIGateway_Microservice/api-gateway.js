const express = require('express');
const app = express();
const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer();
const jwt = require('jsonwebtoken');

// CRITICAL: This MUST be the exact same secret key used in your Authentication_Microservice
const JWT_SECRETE = "347186591486#^%%ABCF*##GHE";

// =================================================================================
//  THE NEW HTML ERROR PAGE GENERATOR
// =================================================================================
function generateErrorHTML(statusCode, title, message, roast) {
    return `
    <html>
    <head>
        <title>ACCESS DENIED</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@700&family=IBM+Plex+Sans:wght@400;500&display=swap" rel="stylesheet">
        <style>
            :root {
                --background: #1A1212; /* Dark, reddish-black */
                --surface: #2A1A1A;
                --primary: #F94144; /* A strong red for errors */
                --text-primary: #F5F5F5;
                --text-secondary: #A3A3A3;
            }
            body { font-family: 'IBM Plex Sans', sans-serif; background: var(--background); color: var(--text-primary); display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .container { background: var(--surface); border-left: 8px solid var(--primary); border-radius: 8px; max-width: 700px; margin: auto; padding: 40px; box-shadow: 0 0 40px rgba(249, 65, 68, 0.3); text-align: center; }
            .status-code { font-family: 'Exo 2', sans-serif; font-size: 6em; font-weight: 700; color: var(--primary); opacity: 0.5; margin: 0; }
            h1 { font-family: 'Exo 2', sans-serif; color: var(--text-primary); font-size: 2.5em; margin: 10px 0; }
            p { color: var(--text-secondary); font-size: 1.2em; line-height: 1.6; }
            .roast { margin-top: 30px; font-size: 1em; font-style: italic; color: var(--primary); opacity: 0.8; }
        </style>
    </head>
    <body>
        <div class="container">
            <p class="status-code">${statusCode}</p>
            <h1>${title}</h1>
            <p>${message}</p>
            <p class="roast">${roast}</p>
        </div>
    </body>
    </html>`;
}


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

    jwt.verify(token, JWT_SECRETE, (err, user) => {
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
    proxy.web(req, res, { target: 'http://localhost:5001' });
});

app.use('/auth', (req, res) => {
    console.log("Routing to Authentication Service...");
    proxy.web(req, res, { target: 'http://localhost:5002' });
});

// >> Protected Routes (Token and Role are required) <<
app.use('/coach', authToken, authRole('coach'), (req, res) => {
    console.log("Routing to Coach Service...");
    proxy.web(req, res, { target: 'http://localhost:5003' });
});

app.use('/player', authToken, authRole('player'), (req, res) => {
    console.log("Routing to Player Service...");
    proxy.web(req, res, { target: 'http://localhost:5004' });
});

// !!! NEW ADMIN ROUTE, POINTING TO THE COACH SERVER !!!
// Requires 'admin' role
app.use('/admin', authToken, authRole('admin'), (req, res) => {
    console.log("Routing ADMIN request to Coach Service...");
    // Forward the request to the same server as the coach service
    proxy.web(req, res, { target: 'http://localhost:5003' });
});

// Start the API Gateway server on Port 4000
app.listen(4000, () => console.log('API Gateway running on Port 4000'));