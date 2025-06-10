// Success HTML
function generateSuccessHTML(token) {
    return `
        <html>
        <head>
            <title>Access Granted!</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Russo+One&family=Lato:wght@400;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Lato', sans-serif; background-color: #0d0d1a; background-image: linear-gradient(315deg, #0d0d1a 0%, #1a1a3e 74%); color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; overflow: hidden; }
                .container { background: rgba(0, 0, 0, 0.5); border: 2px solid #00ffdd; border-radius: 16px; padding: 40px; text-align: center; box-shadow: 0 0 40px rgba(0, 255, 221, 0.4); backdrop-filter: blur(8px); animation: fadeIn 1s ease-in-out; max-width: 650px; }
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                h1 { font-family: 'Russo One', sans-serif; color: #00ffdd; font-size: 3em; margin: 0 0 10px 0; text-shadow: 0 0 15px #00ffdd; }
                p { font-size: 1.3em; font-weight: 400; color: #cccccc; line-height: 1.5; margin-bottom: 30px; }
                .token-box { background: #111; border: 1px dashed #444; padding: 15px; margin: 30px 0; border-radius: 8px; word-wrap: break-word; font-family: monospace; text-align: left; color: #00ffdd; }
                button { background-color: #00ffdd; color: #0d0d1a; border: none; padding: 12px 25px; font-family: 'Russo One', sans-serif; font-size: 1em; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; }
                button:hover { background-color: #fff; box-shadow: 0 0 20px #00ffdd; }
                #copy-feedback { display: block; margin-top: 15px; height: 20px; color: #00ffdd; font-weight: bold; opacity: 0; transition: opacity 0.5s ease; }
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
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(tokenText).then(() => {
                            showFeedback('Copied to clipboard!');
                        }).catch(err => {
                            showFeedback('Could not copy automatically.');
                        });
                    } else {
                        try {
                            const textArea = document.createElement('textarea');
                            textArea.value = tokenText;
                            textArea.style.position = 'fixed';
                            textArea.style.top = '-9999px';
                            document.body.appendChild(textArea);
                            textArea.focus();
                            textArea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textArea);
                            showFeedback('Copied! (Fallback)');
                        } catch (err) {
                            showFeedback('Copying is not supported here.');
                        }
                    }
                }
            </script>
        </body>
        </html>
    `;
}

// Error HTMLs
function generateErrorHTML(title, message, suggestion = "") {
    return `
        <html>
        <head>
            <title>${title}</title>
            <link href="https://fonts.googleapis.com/css2?family=Russo+One&family=Lato:wght@400;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Lato', sans-serif; background: #1a1a3e; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .container { background: rgba(30,0,0,0.7); border: 2px solid #ff0055; border-radius: 16px; padding: 40px; text-align: center; box-shadow: 0 0 40px rgba(255,0,85,0.3); max-width: 500px; }
                h1 { font-family: 'Russo One', sans-serif; color: #ff0055; font-size: 2.5em; margin-bottom: 10px; }
                p { font-size: 1.2em; color: #fff; margin-bottom: 20px; }
                .suggestion { color: #ffcc00; font-size: 1em; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>${title}</h1>
                <p>${message}</p>
                ${suggestion ? `<div class="suggestion">${suggestion}</div>` : ""}
            </div>
        </body>
        </html>
    `;
}

function invalidCredentialsHTML() {
    return generateErrorHTML(
        "Access Denied",
        "Invalid credentials. Please check your email and password.",
        "If you forgot your password, contact support or try again."
    );
}

function dbErrorHTML(errorMsg) {
    return generateErrorHTML(
        "Database Error",
        "A server/database error occurred.",
        errorMsg ? `Details: ${errorMsg}` : "Please try again later."
    );
}

function missingFieldsHTML() {
    return generateErrorHTML(
        "Missing Fields",
        "Email and password are required.",
        "Please fill in all required fields and try again."
    );
}

module.exports = {
    generateSuccessHTML,
    invalidCredentialsHTML,
    dbErrorHTML,
    missingFieldsHTML
};