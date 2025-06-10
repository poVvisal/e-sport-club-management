require('dotenv').config()

const express = require('express');
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json());

// --- Importing our schemas and DB connection ---
const dbconnect = require('./dbconnect.js');
const ScheduleModel = require('./schedule_schema.js');
const VodModel = require('./vod_schema.js');
const PersonModel = require('./person_schema.js');
const UI = require('./coachHtml.js');

// Helper function to generate a unique ID
function uniqueid(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
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
        const html = UI('MATCH SCHEDULED!', 'Good call, Coach. The new match is on the books and the team is ready.', doc);
        res.status(201).send(html);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// GET /schedule - Get all scheduled matches
app.get('/schedule', async (req, res) => {
    console.log("FETCHING ALL SCHEDULED MATCHES");
    try {
        const matches = await ScheduleModel.find({}, { __v: 0, _id: 0 });
        if (matches.length === 0) {
            return res.status(404).send({ message: "No matches scheduled yet." });
        }
        const html = UI('SCHEDULED MATCHES', 'Here are the matches you have scheduled, Coach. Let\'s get ready to rumble!', matches);
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send({ message: err.message || 'Error fetching matches' });
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
        const html = UI(`MATCH DETAILS FOR ID ${matchId}`, 'Here are the details for your match, Coach. Let\'s strategize!', match);
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send({ message: err.message || 'Error fetching match details' });
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
        const html = UI('VOD ASSIGNED!', 'Time for some homework. This VOD review will give us the edge.', doc);
        res.status(201).send(html);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// GET /roster - Get a list of all registered players
app.get('/roster', async (req, res) => {
    console.log("FETCHING TEAM ROSTER");
    try {
        const players = await PersonModel.find({ role: 'player' }, { pass: 0, __v: 0, _id: 0 });
        const html = UI('TEAM ROSTER', 'Here are your legends, Coach. Ready for their next command.', players);
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send({ message: err.message || 'Error fetching roster' });
    }
});



// --- Admin-Only API Endpoints ---
// These now live inside the Coach Service but will be protected by an 'admin' role check in the gateway.

// GET /players - View a list of all players
app.get('/players', (req, res) => {
    console.log("ADMIN: Fetching all players");
    PersonModel.find({ role: 'player' }, { pass: 0 })
        .then(players => {
            const html = UI('ALL PLAYERS', 'Here is the list of all players (Admin view).', players);
            res.status(200).send(html);
        })
        .catch(err => res.status(500).send({ message: err.message }));
});

// GET /coaches - View a list of all coaches
app.get('/coaches', (req, res) => {
    console.log("ADMIN: Fetching all coaches");
    PersonModel.find({ role: 'coach' }, { pass: 0 })
        .then(coaches => {
            const html = UI('ALL COACHES', 'Here is the list of all coaches (Admin view).', coaches);
            res.status(200).send(html);
        })
        .catch(err => res.status(500).send({ message: err.message }));
});

// GET /schedules - View a list of all scheduled matches
app.get('/schedules', (req, res) => {
    console.log("ADMIN: Fetching all scheduled matches");
    ScheduleModel.find()
        .then(schedules => {
            const html = UI('ALL SCHEDULES', 'Here are all scheduled matches (Admin view).', schedules);
            res.status(200).send(html);
        })
        .catch(err => res.status(500).send({ message: err.message }));
}); 

// DELETE /user - Remove a player or coach by their email
app.delete('/user', (req, res) => {
    const userEmail = req.body.email;
    if (!userEmail) {
        const html = UI('DELETE USER', "User email is required.", null);
        return res.status(400).send(html);
    }
    console.log(`ADMIN: Deleting user with email: ${userEmail}`);
    PersonModel.findOneAndDelete({ emailid: userEmail })
        .then(deletedUser => {
            if (!deletedUser) {
                const html = UI('DELETE USER', "User not found.", null);
                return res.status(404).send(html);
            }
            const html = UI('DELETE USER', `Successfully deleted user: ${deletedUser.name}`, deletedUser);
            res.status(200).send(html);
        })
        .catch(err => res.status(500).send({ message: err.message }));
});

// ADMIN: Update a user's details by their custom ID
app.put('/user/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    console.log(`ADMIN: Updating user with ID: ${userId}`);
    PersonModel.findOneAndUpdate({ id: userId }, { $set: req.body }, { new: true })
        .then(updatedUser => {
            if (!updatedUser) {
                const html = UI('UPDATE USER', "User not found.", null);
                return res.status(404).send(html);
            }
            const html = UI('UPDATE USER', "User updated successfully", updatedUser);
            res.status(200).send(html);
        })
        .catch(err => res.status(500).send({ message: err.message }));
});

// ADMIN: DELETE a user by their custom ID
app.delete('/user/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    console.log(`ADMIN: Deleting user with ID: ${userId}`);
    PersonModel.findOneAndDelete({ id: userId })
        .then(deletedUser => {
            if (!deletedUser) {
                const html = UI('DELETE USER', "User not found.", null);
                return res.status(404).send(html);
            }
            const html = UI('DELETE USER', `Successfully deleted user: ${deletedUser.name}`, deletedUser);
            res.status(200).send(html);
        })
        .catch(err => res.status(500).send({ message: err.message }));
});

// ADMIN: Update a schedule's details by its custom matchId
app.put('/schedule/:matchId', (req, res) => {
    const matchId = parseInt(req.params.matchId);
    console.log(`ADMIN: Updating schedule with matchID: ${matchId}`);
    ScheduleModel.findOneAndUpdate({ matchId: matchId }, { $set: req.body }, { new: true })
        .then(updatedSchedule => {
            if (!updatedSchedule) {
                const html = UI('UPDATE SCHEDULE', "Schedule not found.", null);
                return res.status(404).send(html);
            }
            const html = UI('UPDATE SCHEDULE', "Schedule updated successfully", updatedSchedule);
            res.status(200).send(html);
        })
        .catch(err => res.status(500).send({ message: err.message }));
});

// ADMIN: DELETE a schedule by its custom matchId
app.delete('/schedule/:matchId', (req, res) => {
    const matchId = parseInt(req.params.matchId);
    console.log(`ADMIN: Deleting schedule with matchID: ${matchId}`);
    ScheduleModel.findOneAndDelete({ matchId: matchId })
        .then(deletedSchedule => {
            if (!deletedSchedule) {
                const html = UI('DELETE SCHEDULE', "Schedule not found.", null);
                return res.status(404).send(html);
            }
            const html = UI('DELETE SCHEDULE', `Successfully deleted schedule vs ${deletedSchedule.opponent}`, deletedSchedule);
            res.status(200).send(html);
        })
        .catch(err => res.status(500).send({ message: err.message }));
});

// PUT /coach/update-password - Coach updates their password
app.put('/update-password', async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;
    if (!email || !currentPassword || !newPassword) {
        const html = UI('UPDATE PASSWORD', 'Email, current password, and new password are required.', null);
        return res.status(400).send(html);
    }

    try {
        const user = await PersonModel.findOne({ emailid: email, role: 'coach' });
        if (!user) {
            const html = UI('UPDATE PASSWORD', 'Coach not found.', null);
            return res.status(404).send(html);
        }
        if (user.pass !== currentPassword) {
            const html = UI('UPDATE PASSWORD', 'Current password is incorrect.', null);
            return res.status(401).send(html);
        }
        user.pass = newPassword;
        await user.save();
        const html = UI('UPDATE PASSWORD', 'Password updated successfully.', { name: user.name, emailid: user.emailid, role: user.role });
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// PUT /admin/update-password - Admin updates their password
app.put('/admin/update-password', async (req, res) => {
    const { email, currentPassword, newPassword } = req.body;
    if (!email || !currentPassword || !newPassword) {
        const html = UI('UPDATE PASSWORD', 'Email, current password, and new password are required.', null);
        return res.status(400).send(html);
    }

    try {
        const user = await PersonModel.findOne({ emailid: email, role: 'admin' });
        if (!user) {
            const html = UI('UPDATE PASSWORD', 'Admin not found.', null);
            return res.status(404).send(html);
        }
        if (user.pass !== currentPassword) {
            const html = UI('UPDATE PASSWORD', 'Current password is incorrect.', null);
            return res.status(401).send(html);
        }
        user.pass = newPassword;
        await user.save();
        const html = UI('UPDATE PASSWORD', 'Password updated successfully.', { name: user.name, emailid: user.emailid, role: user.role });
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// PUT /coach/reset-password - Coach resets (forgets) their password using mobile verification
app.put('/coach/reset-password', async (req, res) => {
    const { email, mobile, newPassword } = req.body;
    if (!email || !mobile || !newPassword) {
        const html = UI('RESET PASSWORD', 'Email, mobile number, and new password are required.', null);
        return res.status(400).send(html);
    }

    try {
        const user = await PersonModel.findOne({ emailid: email, mobile: mobile, role: 'coach' });
        if (!user) {
            const html = UI('RESET PASSWORD', 'Coach not found or mobile number does not match.', null);
            return res.status(404).send(html);
        }
        user.pass = newPassword;
        await user.save();
        const html = UI('RESET PASSWORD', 'Password reset successfully.', { name: user.name, emailid: user.emailid, role: user.role });
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// PUT /admin/reset-password - Admin resets (forgets) their password using mobile verification
app.put('/admin/reset-password', async (req, res) => {
    const { email, mobile, newPassword } = req.body;
    if (!email || !mobile || !newPassword) {
        const html = UI('RESET PASSWORD', 'Email, mobile number, and new password are required.', null);
        return res.status(400).send(html);
    }

    try {
        const user = await PersonModel.findOne({ emailid: email, mobile: mobile, role: 'admin' });
        if (!user) {
            const html = UI('RESET PASSWORD', 'Admin not found or mobile number does not match.', null);
            return res.status(404).send(html);
        }
        user.pass = newPassword;
        await user.save();
        const html = UI('RESET PASSWORD', 'Password reset successfully.', { name: user.name, emailid: user.emailid, role: user.role });
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// GET /coach/player-search?email=... OR /coach/player-search?id=...
app.get('/coach/player-search', async (req, res) => {
    const { id, email } = req.query;
    if (!id && !email) {
        const html = UI('PLAYER SEARCH', 'Provide either player ID or email.', null);
        return res.status(400).send(html);
    }
    let query = { role: 'player' };
    if (id) query.id = parseInt(id);
    if (email) query.emailid = email;
    try {
        const player = await PersonModel.findOne(query, { pass: 0, __v: 0, _id: 0 });
        if (!player) {
            const html = UI('PLAYER SEARCH', 'Player not found.', null);
            return res.status(404).send(html);
        }
        const html = UI('PLAYER SEARCH', 'Player found.', player);
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// GET /admin/coach-search?email=... OR /admin/coach-search?id=...
app.get('/admin/coach-search', async (req, res) => {
    const { id, email } = req.query;
    if (!id && !email) {
        const html = UI('COACH SEARCH', 'Provide either coach ID or email.', null);
        return res.status(400).send(html);
    }
    let query = { role: 'coach' };
    if (id) query.id = parseInt(id);
    if (email) query.emailid = email;
    try {
        const coach = await PersonModel.findOne(query, { pass: 0, __v: 0, _id: 0 });
        if (!coach) {
            const html = UI('COACH SEARCH', 'Coach not found.', null);
            return res.status(404).send(html);
        }
        const html = UI('COACH SEARCH', 'Coach found.', coach);
        res.status(200).send(html);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// Start the server on port 5003
app.listen(5003, () => console.log('Coach Microservice running on Port 5003'));