// Generates a cool HTML error page for the API Gateway
function generateErrorHTML(statusCode, title, message, roast = '') {
    return `
    <html>
    <head>
        <title>ACCESS DENIED</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@700&family=IBM+Plex+Sans:wght@400;500&display=swap" rel="stylesheet">
        <style>
            :root {
                --background: #1A1212;
                --surface: #2A1A1A;
                --primary: #F94144;
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
            ${roast ? `<p class="roast">${roast}</p>` : ''}
        </div>
    </body>
    </html>`;
}

// Common error HTMLs for API Gateway
const ApiGatewayErrors = {
    missingToken: () =>
        generateErrorHTML(
            401,
            'AUTHENTICATION REQUIRED',
            'You need a security token to access this area.',
            "Trying to sneak in without a pass? That's a bold move, ah lop. It didn't work."
        ),
    invalidToken: () =>
        generateErrorHTML(
            403,
            'INVALID TOKEN',
            'The token you sent is expired, fake, or otherwise busted.',
            "Is this token from a cereal box? Because it's not getting you anywhere. Try again."
        ),
    unauthorizedRole: (userRole, requiredRole) =>
        generateErrorHTML(
            403,
            'UNAUTHORIZED ACCESS',
            `Your clearance level is '${userRole}', but this area requires '${requiredRole}'.`,
            'This is the VIP section, not general admission. Nice try, though.'
        ),
    // --- THIS IS THE PART I CHANGED ---
    notFound: () =>
        generateErrorHTML(
            '404',
            'ARE YOU LOST?',
            "This route doesn't exist. Check the URL, my dude.",
            "You've wandered so far off the path, you might need a GPS to find your way back to reality."
        ),
    internalError: (errMsg = 'Something went wrong on the server.') =>
        generateErrorHTML(
            500,
            'SERVER ERROR',
            errMsg,
            'Even the best servers have bad days. Try again later.'
        )
};

module.exports = {
    generateErrorHTML,
    ApiGatewayErrors,
};