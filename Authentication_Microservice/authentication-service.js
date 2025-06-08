require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
app.use(express.json());


// CRITICAL: This MUST be the exact same secret key used in your API_Gateway
const JWT_SECRET = process.env.JWT_SECRET;

const PersonModel = require('./person_schema.js');
const dbconnect = require('./dbconnect.js');

// Helper function to generate that sick HTML response
// Helper function to generate that sick HTML response - V2
function generateSuccessHTML(token) {
    return `
        <html>
        <head>
            <title>Access Granted!</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Russo+One&family=Lato:wght@400;700&display=swap" rel="stylesheet">
            <style>
                body {
                    font-family: 'Lato', sans-serif; /* Using Lato for the body now */
                    background-color: #0d0d1a;
                    background-image: linear-gradient(315deg, #0d0d1a 0%, #1a1a3e 74%);
                    color: #fff;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    overflow: hidden;
                }
                .container {
                    background: rgba(0, 0, 0, 0.5);
                    border: 2px solid #00ffdd;
                    border-radius: 16px;
                    padding: 40px;
                    text-align: center;
                    box-shadow: 0 0 40px rgba(0, 255, 221, 0.4);
                    backdrop-filter: blur(8px);
                    animation: fadeIn 1s ease-in-out;
                    max-width: 650px; /* A bit wider for long tokens */
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                h1 {
                    font-family: 'Russo One', sans-serif;
                    color: #00ffdd;
                    font-size: 3em;
                    margin: 0 0 10px 0;
                    text-shadow: 0 0 15px #00ffdd;
                }
                p {
                    font-size: 1.3em; /* Made it a bit bigger */
                    font-weight: 400;
                    color: #cccccc;
                    line-height: 1.5; /* Better spacing */
                    margin-bottom: 30px;
                }
                .token-box {
                    background: #111;
                    border: 1px dashed #444;
                    padding: 15px;
                    margin: 30px 0;
                    border-radius: 8px;
                    word-wrap: break-word;
                    font-family: monospace;
                    text-align: left;
                    color: #00ffdd;
                }
                button {
                    background-color: #00ffdd;
                    color: #0d0d1a;
                    border: none;
                    padding: 12px 25px;
                    font-family: 'Russo One', sans-serif;
                    font-size: 1em;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                button:hover {
                    background-color: #fff;
                    box-shadow: 0 0 20px #00ffdd;
                }
                #copy-feedback {
                    display: block;
                    margin-top: 15px;
                    height: 20px; /* Reserve space to prevent layout shift */
                    color: #00ffdd;
                    font-weight: bold;
                    opacity: 0;
                    transition: opacity 0.5s ease;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>ACCESS GRANTED</h1>
                <p>Welcome back, Legend. Your secure token is generated below.</p>
                <div class="token-box" id="token-text">${token}</div>
                <button onclick="copyToken()">Copy Token</button>
                <span id="copy-feedback"></span>
            </div>

            <script>
                function showFeedback(message) {
                    const feedback = document.getElementById('copy-feedback');
                    feedback.innerText = message;
                    feedback.style.opacity = 1;
                    setTimeout(() => { feedback.style.opacity = 0; }, 2000);
                }

                function copyToken() {
                    const tokenText = document.getElementById('token-text').innerText;

                    // Modern way: navigator.clipboard (Secure contexts only - HTTPS/localhost)
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(tokenText).then(() => {
                            showFeedback('Copied to clipboard!');
                        }).catch(err => {
                            showFeedback('Could not copy automatically.');
                            console.error('Modern copy failed: ', err);
                        });
                    } else {
                        // Fallback way: for older browsers or insecure contexts
                        try {
                            const textArea = document.createElement('textarea');
                            textArea.value = tokenText;
                            textArea.style.position = 'fixed'; // Hide it from view
                            textArea.style.top = '-9999px';
                            document.body.appendChild(textArea);
                            textArea.focus();
                            textArea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textArea);
                            showFeedback('Copied! (Fallback)');
                        } catch (err) {
                            showFeedback('Copying is not supported here.');
                            console.error('Fallback copy failed: ', err);
                        }
                    }
                }
            </script>
        </body>
        </html>
    `;
}

// The Login API Endpoint - now using async/await and properly secured
app.post("/login", async (req, res) => {
    console.log("Login attempt for:", req.body.email);

    try {
        // Find a user that matches ONLY the email and password
        // Using findOne because email should be unique. It's cleaner.
        const foundUser = await PersonModel.findOne({
            "emailid": req.body.email,
            "pass": req.body.password
        });

        if (foundUser) {
            // SUCCESS! User found.
            // *** CRITICAL SECURITY FIX ***
            // The role is taken from the DATABASE (foundUser.role), NOT the request body.
            const token = jwt.sign(
                {
                    email: foundUser.emailid,
                    role: foundUser.role // THIS IS THE WAY
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Send back the hyped-up HTML page
            const htmlResponse = generateSuccessHTML(token);
            res.status(200).send(htmlResponse);

        } else {
            // If no document matches, send an error
            // Don't just send plain text, that's lazy.
            res.status(401).send({ message: "Invalid credentials. Access Denied." });
        }
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).send({ message: err.message || 'Error connecting to the database.' });
    }
});

app.listen(5002, () => console.log('Authentication Service running securely on PORT 5002'));