require('dotenv').config();

const express = require('express');
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json());
const jwt = require('jsonwebtoken');

// --- Importing our schemas and DB connection ---
const dbconnect = require('./dbconnect.js');
const ScheduleModel = require('./schedule_schema.js');
const VodModel = require('./vod_schema.js');
const PersonModel = require('./person_schema.js');
const UI = { generateCoachHTML, generateScheduleTableHTML } = require('./coachHtml.js');

const JWT_SECRET = process.env.JWT_SECRET;

// Helper function to generate a unique ID
function uniqueid(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// Middleware to authenticate and attach user info to req.user
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).send(UI.generateCoachHTML('AUTH ERROR', 'No token provided.', null));
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).send(UI.generateCoachHTML('AUTH ERROR', 'Invalid token.', null));
        req.user = user;
        next();
    });
}

// Apply authenticateToken to all protected routes
app.use(['/update-password', '/reset-password'], authenticateToken);

// POST /schedule - Create a new match
app.post('/schedule', async (req, res) => {
    console.log("CREATING NEW MATCH");
    const { opponent, matchDate, game } = req.body;
    const missingFields = [];
    if (!opponent) missingFields.push('opponent');
    if (!matchDate) missingFields.push('matchDate');
    if (!game) missingFields.push('game');

    if (missingFields.length > 0) {
        return res.status(400).send({
            message: `Missing required match info: ${missingFields.join(', ')}`
        });
    }
    try {
        const newMatch = new ScheduleModel({
            matchId: uniqueid(1000, 9999),
            opponent,
            matchDate,
            game
        });
        const doc = await newMatch.save();
        const html = UI.generateCoachHTML('MATCH SCHEDULED!', 'Good call, Coach. The new match is on the books and the team is ready.', doc);
        res.status(201).send(html);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// GET /schedule - Get all scheduled matches (improved)
app.get('/schedule', async (req, res) => {
    console.log("FETCHING MATCH SCHEDULE");
    try {
        const matches = await ScheduleModel.find().sort({ matchDate: 1 });
        const html = UI.generateScheduleTableHTML(
            'Scheduled Matches',
            "Here are the upcoming battles, Coach. Let's get ready to rumble!",
            matches
        );
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send(UI.generateCoachHTML('Error', err.message || 'Error fetching schedule', null));
    }
});

// GET /schedule/:matchId - Get details of a specific match by matchId
app.get('/schedule/:matchId', async (req, res) => {
    const matchId = parseInt(req.params.matchId);
    console.log(`FETCHING DETAILS FOR MATCH ID: ${matchId}`);
    try {
        const match = await ScheduleModel.findOne({ matchId: matchId }, { __v: 0, _id: 0 });
        if (!match) {
            return res.status(404).send({ message: `No match found with ID ${matchId}` });
        }
        const html = UI.generateCoachHTML(`MATCH DETAILS FOR ID ${matchId}`, 'Here are the details for your match, Coach. Let\'s strategize!', match);
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send(UI.generateCoachHTML('Error', err.message || 'Error fetching match details', null));
    }
});

// POST /assignvod - Assign a VOD for a player to review
app.post('/assignvod', async (req, res) => {
    console.log(`ASSIGNING VOD FOR MATCH ${req.body.matchId} TO PLAYER ${req.body.playerEmail}`);
    try {
        const newVod = new VodModel({
            vodId: uniqueid(1000, 9999),
            matchId: req.body.matchId,
            assignedToPlayerEmail: req.body.playerEmail
        });
        const doc = await newVod.save();
        const html = UI.generateCoachHTML('VOD ASSIGNED!', 'Time for some homework. This VOD review will give us the edge.', doc);
        res.status(201).send(html);
    } catch (err) {
        res.status(500).send(UI.generateCoachHTML('Error', err.message || 'Error assigning VOD', null));
    }
});

// GET /roster - Get a list of all registered players
app.get('/roster', async (req, res) => {
    console.log("FETCHING TEAM ROSTER");
    try {
        const players = await PersonModel.find({ role: 'player' }, { pass: 0, __v: 0, _id: 0 });
        const html = UI.generateCoachHTML('TEAM ROSTER', 'Here are your legends, Coach. Ready for their next command.', players);
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send(UI.generateCoachHTML('Error', err.message || 'Error fetching roster', null));
    }
});

// --- Admin-Only API Endpoints ---
// GET /players - View a list of all players
app.get('/players', async (req, res) => {
    console.log("ADMIN: Fetching all players");
    try {
        const players = await PersonModel.find({ role: 'player' }, { pass: 0 });
        const html = UI.generateCoachHTML('ALL PLAYERS', 'Here is the list of all players (Admin view).', players);
        res.status(200).send(html); 
    } catch (err) {
        res.status(500).send(UI.generateCoachHTML('Error', err.message || 'Error fetching players', null));
    }
});

// GET /coaches - View a list of all coaches
app.get('/coaches', async (req, res) => {
    console.log("ADMIN: Fetching all coaches");
    try {
        const coaches = await PersonModel.find({ role: 'coach' }, { pass: 0 });
        const html = UI.generateCoachHTML('ALL COACHES', 'Here is the list of all coaches (Admin view).', coaches);
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send(UI.generateCoachHTML('Error', err.message || 'Error fetching coaches', null));
    }
});

// GET /schedules - View a list of all scheduled matches (ADMIN)
app.get('/schedules', async (req, res) => {
    console.log("FETCHING MATCH SCHEDULE");
    try {
        const matches = await ScheduleModel.find().sort({ matchDate: 1 });
        const html = UI.generateScheduleTableHTML(
            'Scheduled Matches',
            "Here are the upcoming battles, Coach. Let's get ready to rumble!",
            matches
        );
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send(UI.generateCoachHTML('Error', err.message || 'Error fetching schedule', null));
    }
});

// DELETE /user - Remove a player or coach by their email
app.delete('/user', async (req, res) => {
    const userEmail = req.body.email;
    if (!userEmail) {
        const html = UI.generateCoachHTML('DELETE USER', "User email is required.", null);
        return res.status(400).send(html);
    }
    console.log(`ADMIN: Deleting user with email: ${userEmail}`);
    try {
        const deletedUser = await PersonModel.findOneAndDelete({ emailid: userEmail });
        if (!deletedUser) {
            const html = UI.generateCoachHTML('DELETE USER', "User not found.", null);
            return res.status(404).send(html);
        }
        const html = UI.generateCoachHTML('DELETE USER', `Successfully deleted user: ${deletedUser.name}`, deletedUser);
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send(UI.generateCoachHTML('Error', err.message || 'Error deleting user', null));
    }
});

// ADMIN: Update a user's details by their custom ID
app.put('/user/:id', async (req, res) => {
    const userId = parseInt(req.params.id);
    console.log(`ADMIN: Updating user with ID: ${userId}`);
    try {
        const updatedUser = await PersonModel.findOneAndUpdate({ id: userId }, { $set: req.body }, { new: true });
        if (!updatedUser) {
            const html = UI.generateCoachHTML('UPDATE USER', "User not found.", null);
            return res.status(404).send(html);
        }
        const html = UI.generateCoachHTML('UPDATE USER', "User updated successfully", updatedUser);
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send(UI.generateCoachHTML('Error', err.message || 'Error updating user', null));
    }
});

// ADMIN: DELETE a user by their custom ID
app.delete('/user/:id', async (req, res) => {
    const userId = parseInt(req.params.id);
    console.log(`ADMIN: Deleting user with ID: ${userId}`);
    try {
        const deletedUser = await PersonModel.findOneAndDelete({ id: userId });
        if (!deletedUser) {
            const html = UI.generateCoachHTML('DELETE USER', "User not found.", null);
            return res.status(404).send(html);
        }
        const html = UI.generateCoachHTML('DELETE USER', `Successfully deleted user: ${deletedUser.name}`, deletedUser);
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send(UI.generateCoachHTML('Error', err.message || 'Error deleting user', null));
    }
});

// ADMIN: Update a schedule's details by its custom matchId
app.put('/schedule/:matchId', async (req, res) => {
    const matchId = parseInt(req.params.matchId);
    console.log(`ADMIN: Updating schedule with matchID: ${matchId}`);
    try {
        const updatedSchedule = await ScheduleModel.findOneAndUpdate({ matchId: matchId }, { $set: req.body }, { new: true });
        if (!updatedSchedule) {
            const html = UI.generateCoachHTML('UPDATE SCHEDULE', "Schedule not found.", null);
            return res.status(404).send(html);
        }
        const html = UI.generateCoachHTML('UPDATE SCHEDULE', "Schedule updated successfully", updatedSchedule);
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send(UI.generateCoachHTML('Error', err.message || 'Error updating schedule', null));
    }
});

// ADMIN: DELETE a schedule by its custom matchId
app.delete('/schedule/:matchId', async (req, res) => {
    const matchId = parseInt(req.params.matchId);
    console.log(`ADMIN: Deleting schedule with matchID: ${matchId}`);
    try {
        const deletedSchedule = await ScheduleModel.findOneAndDelete({ matchId: matchId });
        if (!deletedSchedule) {
            const html = UI.generateCoachHTML('DELETE SCHEDULE', "Schedule not found.", null);
            return res.status(404).send(html);
        }
        const html = UI.generateCoachHTML('DELETE SCHEDULE', `Successfully deleted schedule vs ${deletedSchedule.opponent}`, deletedSchedule);
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send(UI.generateCoachHTML('Error', err.message || 'Error deleting schedule', null));
    }
});

// Unified password update endpoint
app.put('/update-password', authenticateToken, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!req.user || !req.user.emailid || !req.user.role) {
        return res.status(401).send(UI.generateCoachHTML('UPDATE PASSWORD', 'Invalid user in token.', null));
    }
    if (!oldPassword || !newPassword) {
        return res.status(400).send(UI.generateCoachHTML('UPDATE PASSWORD', 'Old and new password are required.', null));
    }
    if (newPassword.length < 6) {
        return res.status(400).send(UI.generateCoachHTML('UPDATE PASSWORD', 'New password must be at least 6 characters.', null));
    }

    try {
        const user = await PersonModel.findOne({ emailid: req.user.emailid, role: req.user.role });
        if (!user) {
            return res.status(404).send(UI.generateCoachHTML('UPDATE PASSWORD', `${req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1)} not found.`, null));
        }
        if (user.pass !== oldPassword) {
            return res.status(401).send(UI.generateCoachHTML('UPDATE PASSWORD', 'Old password is incorrect.', null));
        }
        user.pass = newPassword;
        await user.save();
        const html = UI.generateCoachHTML('UPDATE PASSWORD', 'Password updated successfully.', { name: user.name, emailid: user.emailid, role: user.role });
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send(UI.generateCoachHTML('Error', err.message || 'Error updating password', null));
    }
});

// Unified password reset endpoint
app.put('/reset-password', authenticateToken, async (req, res) => {
    const { mobile, newPassword } = req.body;
    if (!req.user || !req.user.emailid || !req.user.role) {
        return res.status(401).send(UI.generateCoachHTML('RESET PASSWORD', 'Invalid user in token.', null));
    }
    if (!mobile || !newPassword) {
        return res.status(400).send(UI.generateCoachHTML('RESET PASSWORD', 'Mobile number and new password are required.', null));
    }

    try {
        const user = await PersonModel.findOne({ emailid: req.user.emailid, mobile: mobile, role: req.user.role });
        if (!user) {
            return res.status(404).send(UI.generateCoachHTML('RESET PASSWORD', `${req.user.role.charAt(0).toUpperCase() + req.user.role.slice(1)} not found or mobile number does not match.`, null));
        }
        user.pass = newPassword;
        await user.save();
        const html = UI.generateCoachHTML('RESET PASSWORD', 'Password reset successfully.', { name: user.name, emailid: user.emailid, role: user.role });
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send(UI.generateCoachHTML('Error', err.message || 'Error resetting password', null));
    }
});

// GET /player-search?email=... OR /player-search?id=...
app.get('/player-search', async (req, res) => {
    const { id, email } = req.query;
    if (!id && !email) {
        const html = UI.generateCoachHTML('PLAYER SEARCH', 'Provide either player ID or email.', null);
        return res.status(400).send(html);
    }
    let query = { role: 'player' };
    if (id) query.id = parseInt(id);
    if (email) query.emailid = email;
    try {
        const player = await PersonModel.findOne(query, { pass: 0, __v: 0, _id: 0 });
        if (!player) {
            const html = UI.generateCoachHTML('PLAYER SEARCH', 'Player not found.', null);
            return res.status(404).send(html);
        }
        const html = UI.generateCoachHTML('PLAYER SEARCH', 'Player found.', player);
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send(UI.generateCoachHTML('Error', err.message || 'Error fetching player', null));
    }
});

// GET /coach-search?email=... OR /coach-search?id=...
app.get('/coach-search', async (req, res) => {
    const { id, email } = req.query;
    if (!id && !email) {
        const html = UI.generateCoachHTML('COACH SEARCH', 'Provide either coach ID or email.', null);
        return res.status(400).send(html);
    }
    let query = { role: 'coach' };
    if (id) query.id = parseInt(id);
    if (email) query.emailid = email;
    try {
        const coach = await PersonModel.findOne(query, { pass: 0, __v: 0, _id: 0 });
        if (!coach) {
            const html = UI.generateCoachHTML('COACH SEARCH', 'Coach not found.', null);
            return res.status(404).send(html);
        }
        const html = UI.generateCoachHTML('COACH SEARCH', 'Coach found.', coach);
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send(UI.generateCoachHTML('Error', err.message || 'Error fetching coach', null));
    }
});

// GET /admin/schedule - Admin fetches all scheduled matches
app.get('/admin/schedule', async (req, res) => {
    console.log("ADMIN: Fetching all scheduled matches");
    try {
        const matches = await ScheduleModel.find().sort({ matchDate: 1 });
        const html = generateScheduleTableHTML(
            'All Scheduled Matches',
            "Admin view: Here are all scheduled matches.",
            matches
        );
        res.status(200).send(html); 
    } catch (err) {
        res.status(500).send(UI.generateCoachHTML('Error', err.message || 'Error fetching schedule', null));
    }
});

// Start the server on port 5002
app.listen(5002, () => console.log('Coach Microservice running on Port 5002'));
