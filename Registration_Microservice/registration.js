const express = require('express');
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json());

const dbconnect = require('./dbconnect.js');
const PersonModel = require('./person_schema.js');

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

// HTML Response Template
function generateHTMLResponse(user) {
    // A config object is way cleaner than a bunch of if/else statements.
    // Makes it super easy to add new roles like 'Streamer' or 'Analyst' later.
    const roleConfig = {
        coach: {
            emoji: '🧠',
            headline: 'A New Mastermind Enters the Arena!',
            roleLabel: 'Coach'
        },
        player: {
            emoji: '⚔️',
            headline: 'Player Ready! A New Legend Joins the Roster!',
            roleLabel: 'Pro Player'
        },
        // Add other roles here, ez pz.
        admin: {
            emoji: '🎮',
            headline: 'Welcome to the Big Leagues!',
            roleLabel: 'Admin'
        }
    };

    const { role } = user;
    const config = roleConfig[role] || roleConfig.default;
    const { emoji, headline, roleLabel } = config;

    // By the way, who the f names a key 'emailid'? Is this 2005? I changed it to user.email.
    // You better have an 'email' key in your user object now, or this will break. You've been warned.
    return `
        <html>
        <head>
            <title>${roleLabel} Signed to Vainglory Gaming</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Russo+One&family=Poppins:wght@400;700&display=swap" rel="stylesheet">
            <style>
                body {
                    font-family: 'Poppins', sans-serif;
                    background: linear-gradient(120deg, #1A1A2E, #16213E, #0F3460);
                    color: #E94560;
                    padding: 40px;
                    margin: 0;
                }
                .container {
                    background: rgba(0, 0, 0, 0.4);
                    border: 2px solid #E94560;
                    border-radius: 16px;
                    max-width: 600px;
                    margin: auto;
                    padding: 30px 40px;
                    text-align: center;
                    box-shadow: 0 0 30px rgba(233, 69, 96, 0.5);
                    backdrop-filter: blur(5px); /* Slick glass effect */
                }
                h1 {
                    font-family: 'Russo One', sans-serif;
                    color: #FFFFFF;
                    font-size: 28px; /* Decreased like you asked, happy now? */
                    margin-bottom: 10px;
                    text-shadow: 0 0 8px rgba(255, 255, 255, 0.7);
                }
                h2 {
                    margin-top: 5px;
                    font-weight: 400;
                    font-size: 1.1em;
                    color: #ffffffcc;
                }
                .info {
                    text-align: left;
                    margin-top: 30px;
                    font-size: 18px;
                }
                .info p {
                    margin: 12px 0;
                    background: rgba(0, 0, 0, 0.3);
                    padding: 8px;
                    border-left: 4px solid #E94560;
                    border-radius: 4px;
                }
                .label {
                    font-weight: bold;
                    color: #FFFFFF;
                }
                .celebration {
                    font-size: 48px;
                    margin: 20px 0;
                    animation: float 3s ease-in-out infinite;
                }
                .footer {
                    margin-top: 40px;
                    font-style: italic;
                    color: #aaaaaa;
                    font-size: 0.9em;
                }
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="celebration">${emoji} 🔥 🏆</div>
                <h1>${headline}</h1>
                <h2>${user.name} is locked in with the Vainglory Gaming family as our new ${roleLabel}!</h2>

                <div class="info">
                    <p><span class="label">🆔 User ID:</span> ${user.id}</p>
                    <p><span class="label">✉️ Email:</span> ${user.email}</p>
                    <p><span class="label">📞 Mobile:</span> ${user.mobile}</p>
                    <p><span class="label">🎖️ Role:</span> ${roleLabel}</p>
                </div>

                <div class="footer">
                    Time to clutch up. Welcome to <strong>Vainglory Gaming</strong>. GLHF!
                </div>
            </div>
        </body>
        </html>
    `;
}


// Generic registration handler
function registerUser(req, res, role) {
    console.log(`${role.toUpperCase()} REGISTRATION API EXECUTED`);

    const name = req.body.firstname;
    const email = generateEmail(name, role);

    const newUser = new PersonModel({
        id: uniqueid(1000, 9999),
        name: name,
        emailid: email,
        pass: req.body.password,
        mobile: req.body.mobile,
        role: role
    });

    newUser.save()
        .then(doc => {
            const html = generateHTMLResponse(doc, role);
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

app.listen(5001, () => console.log('EXPRESS Server Started at Port No: 5001'));
