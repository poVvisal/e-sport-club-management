// Player_Microservice/schedule_schema.js
const schema_mongoose = require('mongoose');

const ScheduleSchema = schema_mongoose.Schema({
    matchId: { type: Number, required: true, unique: true },
    opponent: { type: String, required: true },
    matchDate: { type: Date, required: true },
    game: { type: String, required: true },
    status: { type: String, default: 'Scheduled' } // e.g., 'Scheduled', 'Completed', 'Cancelled'
}, { timestamps: true });

module.exports = schema_mongoose.model('schedule_collection', ScheduleSchema);