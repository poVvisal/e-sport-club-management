const express = require('express');
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json());

// --- Importing our schemas and DB connection ---
const dbconnect = require('./dbconnect.js');
const ScheduleModel = require('./schedule_schema.js');
const VodModel = require('./vod_schema.js');


// =================================================================================
//  PLAYER UI & ERROR GENERATORS
// =================================================================================

// Generates the main UI for the player
function generatePlayerHTML(title, message, data = []) {
    let dataHtml = '';

    // Check if there's data and if it's an array with items
    if (Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0].toObject ? data[0].toObject() : data[0]).filter(key => !['_id', '__v', 'isReviewed', 'reviewNotes'].includes(key));
        dataHtml = `
            <table class="data-table">
                <thead>
                    <tr>
                        ${headers.map(header => `<th>${header.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${data.map(item => `
                        <tr>
                            ${headers.map(header => {
                                let value = item[header];
                                if (header === 'matchDate') {
                                    value = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value));
                                }
                                return `<td>${value}</td>`;
                            }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else if (!Array.isArray(data) && data) { // For single objects like a submitted review
         const dataObject = data.toObject ? data.toObject() : data;
         dataHtml = '<div class="data-list">';
         for (const [key, value] of Object.entries(dataObject)) {
             if (key !== '__v' && key !== '_id') {
                 const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                 dataHtml += `<p><span class="label">${formattedKey}:</span> ${value}</p>`;
             }
         }
         dataHtml += '</div>';
    }


    return `
    <html>
    <head>
        <title>Player Dashboard</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@700&family=IBM+Plex+Sans:wght@400;500&display=swap" rel="stylesheet">
        <style>
            :root {
                --background: #1E1B26;
                --surface: #2A2438;
                --primary: #A78BFA; /* A nice, focused purple */
                --text-primary: #F5F5F5;
                --text-secondary: #A3A3A3;
                --surface-darker: #3D3652;
            }
            body { font-family: 'IBM Plex Sans', sans-serif; background: var(--background); color: var(--text-primary); padding: 40px; margin: 0; }
            .container { background: var(--surface); border: 2px solid var(--primary); border-radius: 16px; max-width: 900px; margin: auto; padding: 40px; box-shadow: 0 0 35px rgba(167, 139, 250, 0.2); }
            h1 { font-family: 'Exo 2', sans-serif; color: var(--primary); font-size: 2.5em; margin: 0 0 10px 0; }
            .player-msg { font-size: 1.3em; color: var(--text-secondary); margin-bottom: 30px; }
            .data-list p { background: var(--surface-darker); padding: 12px; border-left: 4px solid var(--primary); border-radius: 4px; margin: 10px 0; }
            .data-list .label { font-weight: 500; color: var(--text-primary); }
            .data-table { width: 100%; border-collapse: collapse; margin-top: 20px; table-layout: fixed; }
            .data-table th, .data-table td { padding: 16px; text-align: left; border-bottom: 1px solid var(--surface-darker); vertical-align: middle; overflow-wrap: break-word; }
            .data-table th { background-color: var(--primary); color: #1E1B26; font-weight: 500; }
            .data-table tbody tr:hover { background-color: var(--surface-darker); }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>${title}</h1>
            <p class="player-msg">${message}</p>
            ${dataHtml.length > 0 ? dataHtml : ''}
        </div>
    </body>
    </html>`;
}

// Generates a simple HTML error page
function generateErrorHTML(res, statusCode, message) {
    const html = `
        <div style="font-family: sans-serif; text-align: center; padding: 40px; background: #2A1A1A; color: #F5F5F5; border: 2px solid #F94144; border-radius: 16px;">
            <h1 style="color: #F94144;">Error: ${statusCode}</h1>
            <p>${message}</p>
        </div>
    `;
    return res.status(statusCode).send(html);
}


// --- Player-Specific API Endpoints (Upgraded) ---

// GET /player/schedule - View the team's match schedule
app.get('/schedule', async (req, res) => {
    console.log("FETCHING MATCH SCHEDULE");
    try {
        const matches = await ScheduleModel.find().sort({ matchDate: 1 });
        const html = generatePlayerHTML('Upcoming Matches', 'Here\'s the battle schedule. Time to prep.', matches);
        res.status(200).send(html);
    } catch (err) {
        generateErrorHTML(res, 500, err.message || 'Error fetching schedule');
    }
});

// GET /player/myvods - Get VODs specifically assigned to the logged-in player
app.get('/myvods', async (req, res) => {
    if (!req.user || !req.user.email) {
        return generateErrorHTML(res, 401, 'User email not found in token. The Gateway might be misconfigured.');
    }
    const playerEmail = req.user.email;
    console.log(`FETCHING VODS FOR PLAYER: ${playerEmail}`);
    try {
        const vods = await VodModel.find({ assignedToPlayerEmail: playerEmail, isReviewed: false });
        if (!vods.length) {
            const html = generatePlayerHTML('No VODs Pending', 'Your homework is all done, Legend. No VODs to review right now. Go get some reps in!');
            return res.status(200).send(html);
        }
        const html = generatePlayerHTML('Your VOD Assignments', 'Time to study the tape. Find our weaknesses, exploit theirs.', vods);
        res.status(200).send(html);
    } catch (err) {
        generateErrorHTML(res, 500, err.message || 'Error fetching VODs');
    }
});

// PUT /player/reviewvod/:vodId - Player submits their review for a VOD
app.put('/reviewvod/:vodId', async (req, res) => {
    const { vodId } = req.params;
    const { notes } = req.body;
    console.log(`UPDATING VOD REVIEW FOR VOD ID: ${vodId}`);
    try {
        const updatedVod = await VodModel.findOneAndUpdate(
            { vodId: parseInt(vodId) },
            { $set: { isReviewed: true, reviewNotes: notes } },
            { new: true }
        );
        if (!updatedVod) {
            return generateErrorHTML(res, 404, 'VOD not found. It might have been deleted or you have the wrong ID.');
        }
        const html = generatePlayerHTML('Review Submitted!', 'Good work. Your insights have been logged for the coach.', updatedVod);
        res.status(200).send(html);
    } catch (err) {
        generateErrorHTML(res, 500, err.message || 'Error updating VOD');
    }
});

// Start the server on port 5004
app.listen(5004, () => console.log('Player Microservice running on Port 5004'));