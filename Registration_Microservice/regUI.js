function generateHTMLResponse(user) {
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
        admin: {
            emoji: '🎮',
            headline: 'Welcome to the Big Leagues!',
            roleLabel: 'Admin'
        }
    };

    const { role } = user;
    const config = roleConfig[role] || roleConfig.default;
    const { emoji, headline, roleLabel } = config;

    const validMobile = /^\+?\d{10,15}$/.test(user.mobile) ? user.mobile : 'Invalid or Missing';

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
                    backdrop-filter: blur(5px);
                }
                h1 {
                    font-family: 'Russo One', sans-serif;
                    color: #FFFFFF;
                    font-size: 28px;
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
                    <p><span class="label">📞 Mobile:</span> ${validMobile}</p>
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

module.exports = { generateHTMLResponse };