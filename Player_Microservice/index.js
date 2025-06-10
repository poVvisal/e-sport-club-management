const express = require('express');
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json());

// --- Importing our schemas and DB connection ---
const dbconnect = require('./dbconnect.js');
const ScheduleModel = require('./schedule_schema.js');
const VodModel = require('./vod_schema.js');

const { generatePlayerHTML, generateErrorHTML } = require('./playerUI.js');


// --- Player-Specific API Endpoints (Upgraded) ---

// GET /player/schedule - View the team's match schedule
app.get('/schedules', async (req, res) => {
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