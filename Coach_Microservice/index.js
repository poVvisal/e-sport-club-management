const express = require('express');
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json());

// --- Importing our schemas and DB connection ---
const dbconnect = require('./dbconnect.js');
const ScheduleModel = require('./schedule_schema.js');
const VodModel = require('./vod_schema.js');
const PersonModel = require('./person_schema.js');

// Helper function to generate a unique ID
function uniqueid(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Generates a styled HTML response for API calls.
 * Dynamically renders data as a table for arrays or a list for single objects.
 * @param {string} title - The main heading of the page.
 * @param {string} message - A sub-heading or contextual message.
 * @param {object|Array} data - The data to display. Can be a Mongoose doc, a plain object, or an array of objects.
 * @returns {string} The full HTML document as a string.
 */
function generateApiResponseHTML(title, message, data) {
    let dataHtml = '';
    const dataIsArray = Array.isArray(data);

    if (!data || (dataIsArray && data.length === 0)) {
        dataHtml = '<p class="no-data">No data to display. Looks like a clean slate!</p>';
    } else if (dataIsArray) {
        // RENDER A DYNAMIC TABLE FOR ARRAYS (like rosters, player lists, etc.)
        const plainData = data.map(item => item.toObject ? item.toObject() : item);
        const headers = Object.keys(plainData[0]).filter(key => key !== '__v' && key !== '_id' && key !== 'pass');
        const formattedHeaders = headers.map(key => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));

        dataHtml = `
            <table class="data-table">
                <thead>
                    <tr>
                        ${formattedHeaders.map(header => `<th>${header}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${plainData.map(row => `
                        <tr>
                            ${headers.map(header => `<td>${row[header] === undefined ? 'N/A' : row[header]}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else if (typeof data === 'object' && data !== null) {
        // RENDER A LIST FOR SINGLE ITEMS (Match, VOD, single user)
        const dataObject = data.toObject ? data.toObject() : data;
        dataHtml = '<div class="data-list">';
        for (let [key, value] of Object.entries(dataObject)) {
            if (key !== '__v' && key !== '_id' && key !== 'pass') {
                if (key === 'matchDate' && value) {
                    value = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(value));
                }
                const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                dataHtml += `<p><span class="label">${formattedKey}:</span> ${value}</p>`;
            }
        }
        dataHtml += '</div>';
    }

    // --- The main HTML template shell ---
    // (This part is mostly unchanged, but now serves all responses)
    return `
    <html>
    <head>
        <title>Command Center</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500&family=Exo+2:wght@700&family=IBM+Plex+Sans:wght@400;500&display=swap" rel="stylesheet">
        <style>
            :root {
                --background: #111827; --surface: #1F2937; --primary: #38BDF8; --text-primary: #E5E7EB;
                --text-secondary: #9CA3AF; --surface-darker: #374151; --danger: #F47174;
            }
            body { font-family: 'IBM Plex Sans', sans-serif; background: var(--background); color: var(--text-primary); padding: 40px; margin: 0; }
            .container { background: var(--surface); border: 2px solid var(--primary); border-radius: 16px; max-width: 800px; margin: auto; padding: 40px; box-shadow: 0 0 30px rgba(56, 189, 248, 0.3); }
            .error-container { border-color: var(--danger); box-shadow: 0 0 30px rgba(244, 113, 116, 0.4); }
            h1 { font-family: 'Exo 2', sans-serif; color: var(--primary); font-size: 2.5em; margin: 0 0 10px 0; text-shadow: 0 0 10px rgba(56, 189, 248, 0.5); }
            .error-container h1 { color: var(--danger); text-shadow: 0 0 10px rgba(244, 113, 116, 0.6); }
            .coach-msg { font-family: 'Caveat', cursive; font-size: 1.7em; color: var(--text-secondary); margin-bottom: 25px; border-left: 3px solid var(--primary); padding-left: 15px; }
            .error-container .coach-msg { border-left-color: var(--danger); }
            .data-list p { background: var(--surface-darker); padding: 12px; border-left: 4px solid var(--primary); border-radius: 4px; margin: 10px 0; }
            .data-list .label { font-weight: 500; color: var(--text-primary); }
            .data-table { width: 100%; border-collapse: collapse; margin-top: 20px; table-layout: fixed; }
            .data-table th, .data-table td { padding: 16px; text-align: left; border-bottom: 1px solid var(--surface-darker); vertical-align: middle; overflow-wrap: break-word; }
            .data-table th { background-color: var(--primary); color: #111827; font-weight: 500; }
            .data-table tbody tr:hover { background-color: var(--surface-darker); transition: background-color 0.2s ease-in-out; }
            .no-data { background: var(--surface-darker); padding: 20px; text-align: center; font-style: italic; color: var(--text-secondary); border-radius: 8px;}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>${title}</h1>
            <p class="coach-msg">${message}</p>
            ${dataHtml}
        </div>
    </body>
    </html>`;
}

/**
 * Generates a styled HTML error page.
 * @param {string} message - The primary error message to display.
 * @param {number} statusCode - The HTTP status code.
 * @returns {string} The full HTML document for the error page.
 */
function generateErrorHTML(message, statusCode) {
    const titles = {
        400: "Bad Request",
        404: "Not Found",
        500: "Server Error",
    };
    const title = titles[statusCode] || "An Error Occurred";
    const userMessage = "Whoops. Something went wrong. Let's get back on track.";

    return `
    <html>
    <head>
        <title>Error: ${title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500&family=Exo+2:wght@700&family=IBM+Plex+Sans:wght@400;500&display=swap" rel="stylesheet">
         <style>
            :root { --background: #111827; --surface: #1F2937; --danger: #F47174; --text-primary: #E5E7EB; --text-secondary: #9CA3AF; }
            body { font-family: 'IBM Plex Sans', sans-serif; background: var(--background); color: var(--text-primary); padding: 40px; margin: 0; }
            .container { background: var(--surface); border: 2px solid var(--danger); border-radius: 16px; max-width: 800px; margin: auto; padding: 40px; box-shadow: 0 0 30px rgba(244, 113, 116, 0.4); }
            h1 { font-family: 'Exo 2', sans-serif; color: var(--danger); font-size: 2.5em; margin: 0 0 10px 0; text-shadow: 0 0 10px rgba(244, 113, 116, 0.6); }
            .coach-msg { font-family: 'Caveat', cursive; font-size: 1.7em; color: var(--text-secondary); margin-bottom: 25px; border-left: 3px solid var(--danger); padding-left: 15px; }
            .error-details { background: #374151; padding: 15px; border-radius: 8px; font-family: monospace; color: #E5E7EB; }
        </style>
    </head>
    <body>
        <div class="container error-container">
            <h1>${title} (${statusCode})</h1>
            <p class="coach-msg">${userMessage}</p>
            <div class="error-details">${message}</div>
        </div>
    </body>
    </html>`;
}


// =================================================================================
//  COACH-FACING API ENDPOINTS (with HTML responses)
// =================================================================================

app.post('/schedule', async (req, res) => {
    console.log("CREATING NEW MATCH");
    try {
        const newMatch = new ScheduleModel({
            matchId: uniqueid(1000, 9999),
            opponent: req.body.opponent,
            matchDate: req.body.matchDate,
            game: req.body.game
        });
        const doc = await newMatch.save();
        const html = generateApiResponseHTML('MATCH SCHEDULED!', 'Good call, Coach. The new match is on the books.', doc);
        res.status(201).send(html);
    } catch (err) {
        res.status(500).send(generateErrorHTML(err.message, 500));
    }
});

app.post('/assignvod', async (req, res) => {
    console.log(`ASSIGNING VOD FOR MATCH ${req.body.matchId} TO PLAYER ${req.body.playerEmail}`);
    try {
        const newVod = new VodModel({
            vodId: uniqueid(1000, 9999),
            matchId: req.body.matchId,
            assignedToPlayerEmail: req.body.playerEmail
        });
        const doc = await newVod.save();
        const html = generateApiResponseHTML('VOD ASSIGNED!', 'Time for some homework. This will give us the edge.', doc);
        res.status(201).send(html);
    } catch (err) {
        res.status(500).send(generateErrorHTML(err.message, 500));
    }
});

app.get('/roster', async (req, res) => {
    console.log("FETCHING TEAM ROSTER");
    try {
        const players = await PersonModel.find({ role: 'player' }, { pass: 0, __v: 0, _id: 0 });
        const html = generateApiResponseHTML('TEAM ROSTER', 'Here are your legends, Coach. Ready for the next command.', players);
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send(generateErrorHTML(err.message, 500));
    }
});

// =================================================================================
//  ADMIN-ONLY API ENDPOINTS (Now with HTML responses and async/await)
// =================================================================================

app.get('/players', async (req, res) => {
    console.log("ADMIN: Fetching all players");
    try {
        const players = await PersonModel.find({ role: 'player' }, { pass: 0 });
        const html = generateApiResponseHTML('Admin: All Players', 'A complete list of all registered players.', players);
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send(generateErrorHTML(err.message, 500));
    }
});

app.get('/coaches', async (req, res) => {
    console.log("ADMIN: Fetching all coaches");
    try {
        const coaches = await PersonModel.find({ role: 'coach' }, { pass: 0 });
        const html = generateApiResponseHTML('Admin: All Coaches', 'A complete list of all registered coaches.', coaches);
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send(generateErrorHTML(err.message, 500));
    }
});

app.get('/schedules', async (req, res) => {
    console.log("ADMIN: Fetching all scheduled matches");
    try {
        const schedules = await ScheduleModel.find();
        const html = generateApiResponseHTML('Admin: All Schedules', 'A complete list of every match on the books.', schedules);
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send(generateErrorHTML(err.message, 500));
    }
});

app.delete('/user', async (req, res) => {
    const userEmail = req.body.email;
    if (!userEmail) {
        return res.status(400).send(generateErrorHTML("User email is required in the request body.", 400));
    }
    console.log(`ADMIN: Deleting user with email: ${userEmail}`);
    try {
        const deletedUser = await PersonModel.findOneAndDelete({ emailid: userEmail });
        if (!deletedUser) {
            return res.status(404).send(generateErrorHTML(`User with email '${userEmail}' not found.`, 404));
        }
        const html = generateApiResponseHTML('User Deleted', `Successfully removed user: ${deletedUser.name}`, deletedUser);
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send(generateErrorHTML(err.message, 500));
    }
});

app.put('/user/:id', async (req, res) => {
    const userId = parseInt(req.params.id);
    console.log(`ADMIN: Updating user with ID: ${userId}`);
    try {
        const updatedUser = await PersonModel.findOneAndUpdate({ id: userId }, { $set: req.body }, { new: true, select: '-pass' });
        if (!updatedUser) {
            return res.status(404).send(generateErrorHTML(`User with ID '${userId}' not found.`, 404));
        }
        const html = generateApiResponseHTML('User Updated', 'The user\'s details have been successfully modified.', updatedUser);
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send(generateErrorHTML(err.message, 500));
    }
});

app.delete('/user/:id', async (req, res) => {
    const userId = parseInt(req.params.id);
    console.log(`ADMIN: Deleting user with ID: ${userId}`);
    try {
        const deletedUser = await PersonModel.findOneAndDelete({ id: userId }, { select: '-pass' });
        if (!deletedUser) {
            return res.status(404).send(generateErrorHTML(`User with ID '${userId}' not found.`, 404));
        }
        const html = generateApiResponseHTML('User Deleted', `Successfully removed user: ${deletedUser.name}`, deletedUser);
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send(generateErrorHTML(err.message, 500));
    }
});

app.put('/schedule/:matchId', async (req, res) => {
    const matchId = parseInt(req.params.matchId);
    console.log(`ADMIN: Updating schedule with matchID: ${matchId}`);
    try {
        const updatedSchedule = await ScheduleModel.findOneAndUpdate({ matchId: matchId }, { $set: req.body }, { new: true });
        if (!updatedSchedule) {
            return res.status(404).send(generateErrorHTML(`Schedule with matchID '${matchId}' not found.`, 404));
        }
        const html = generateApiResponseHTML('Schedule Updated', 'The match details have been successfully modified.', updatedSchedule);
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send(generateErrorHTML(err.message, 500));
    }
});

app.delete('/schedule/:matchId', async (req, res) => {
    const matchId = parseInt(req.params.matchId);
    console.log(`ADMIN: Deleting schedule with matchID: ${matchId}`);
    try {
        const deletedSchedule = await ScheduleModel.findOneAndDelete({ matchId: matchId });
        if (!deletedSchedule) {
            return res.status(404).send(generateErrorHTML(`Schedule with matchID '${matchId}' not found.`, 404));
        }
        const html = generateApiResponseHTML('Schedule Deleted', `Successfully removed the match vs ${deletedSchedule.opponent}.`, deletedSchedule);
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send(generateErrorHTML(err.message, 500));
    }
});

// Start the server on port 5003
app.listen(5003, () => console.log('Coach Microservice running on Port 5003'));