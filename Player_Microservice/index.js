const express = require('express');
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json());

require('dotenv').config();
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

// JWT middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return generateErrorHTML(res, 401, 'Missing or invalid token.');
    }
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return generateErrorHTML(res, 403, 'Invalid token.');
        }
        req.user = user;
        next(); // <-- This is crucial!
    });
}

// --- Importing our schemas and DB connection ---
const dbconnect = require('./dbconnect.js');
const ScheduleModel = require('./schedule_schema.js');
const VodModel = require('./vod_schema.js');
const PersonModel = require('./person_schema.js');

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
app.get('/myvods', authenticateToken, async (req, res) => {
    if (!req.user || !req.user.emailid || req.user.role !== 'player') {
        return generateErrorHTML(res, 401, 'User not authenticated or not a player.');
    }
    const playerEmail = req.user.emailid;
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
app.put('/reviewvod/:vodId', authenticateToken, async (req, res) => {
    const { vodId } = req.params;
    const { notes } = req.body;
    if (!req.user || !req.user.emailid || req.user.role !== 'player') {
        return generateErrorHTML(res, 401, 'User not authenticated or not a player.');
    }
    console.log(`UPDATING VOD REVIEW FOR VOD ID: ${vodId}`);
    try {
        const updatedVod = await VodModel.findOneAndUpdate(
            { vodId: parseInt(vodId), assignedToPlayerEmail: req.user.emailid },
            { $set: { isReviewed: true, reviewNotes: notes } },
            { new: true }
        );
        if (!updatedVod) {
            return generateErrorHTML(res, 404, 'VOD not found or not assigned to you.');
        }
        const html = generatePlayerHTML('Review Submitted!', 'Good work. Your insights have been logged for the coach.', updatedVod);
        res.status(200).send(html);
    } catch (err) {
        generateErrorHTML(res, 500, err.message || 'Error updating VOD');
    }
});


// PUT /reset-password - Player resets (forgets) their password using mobile verification
app.put('/reset-password', authenticateToken, async (req, res) => {
    const { mobile, newPassword } = req.body;
    if (!req.user || !req.user.emailid || req.user.role !== 'player') {
        return generateErrorHTML(res, 401, 'Invalid user in token.');
    }
    if (!mobile || !newPassword) {
        return generateErrorHTML(res, 400, 'Mobile number and new password are required.');
    }
    if (newPassword.length < 6) {
        return generateErrorHTML(res, 400, 'New password must be at least 6 characters.');
    }
    try {
        const user = await PersonModel.findOne({ emailid: req.user.emailid, mobile: mobile, role: 'player' });
        if (!user) {
            return generateErrorHTML(res, 404, 'Player not found or mobile number does not match.');
        }
        user.pass = newPassword;
        await user.save();
        const html = generatePlayerHTML('Password Reset', 'Your password has been reset successfully.', { name: user.name, emailid: user.emailid });
        res.status(200).send(html);
    } catch (err) {
        generateErrorHTML(res, 500, err.message || 'Error resetting password.');
    }
});

// PUT /update-password - Player updates their password using current password (token required)
app.put('/update-password', authenticateToken, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!req.user || !req.user.emailid || req.user.role !== 'player') {
        return res.status(401).send(generatePlayerHTML('Update Password', 'Invalid user in token.'));
    }
    if (!oldPassword || !newPassword) {
        return res.status(400).send(generatePlayerHTML('Update Password', 'Old and new password are required.'));
    }
    if (newPassword.length < 6) {
        return res.status(400).send(generatePlayerHTML('Update Password', 'New password must be at least 6 characters.'));
    }
    try {
        const user = await PersonModel.findOne({ emailid: req.user.emailid, role: 'player' });
        if (!user) {
            return res.status(404).send(generatePlayerHTML('Update Password', 'Player not found.'));
        }
        if (user.pass !== oldPassword) {
            return res.status(401).send(generatePlayerHTML('Update Password', 'Old password is incorrect.'));
        }
        user.pass = newPassword;
        await user.save();
        return res.status(200).send(generatePlayerHTML('Password Updated', 'Your password has been updated successfully.', { name: user.name, emailid: user.emailid }));
    } catch (err) {
        return res.status(500).send(generatePlayerHTML('Update Password', err.message || 'Error updating password.'));
    }
});

// GET /match/:matchId
app.get('/:matchId', async (req, res) => {
    const matchId = parseInt(req.params.matchId);
    if (!matchId) {
        const html = generatePlayerHTML('MATCH SEARCH', 'Match ID is required.', null);
        return res.status(400).send(html);
    }
    try {
        const match = await ScheduleModel.findOne({ matchId }, { __v: 0, _id: 0 });
        if (!match) {
            const html = generatePlayerHTML('MATCH SEARCH', 'Match not found.', null);
            return res.status(404).send(html);
        }
        const html = generatePlayerHTML('MATCH SEARCH', 'Match found.', match);
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// Start the server on port 5003
app.listen(5003, () => console.log('Player Microservice running on Port 5003'));