// Player_Microservice/vod_schema.js
const schema_mongoose = require('mongoose');

const VodSchema = schema_mongoose.Schema({
    vodId: { type: Number, required: true, unique: true },
    matchId: { type: Number, required: true }, // Links back to the match
    // We use the player's email as a unique identifier to assign the VOD
    assignedToPlayerEmail: { type: String, required: true },
    reviewNotes: { type: String, default: 'Pending player review.' },
    isReviewed: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = schema_mongoose.model('vod_collection', VodSchema);