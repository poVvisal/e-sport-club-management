// Registration_Microservice/person_schema.js
const schema_mongoose = require('mongoose');

const PersonSchema = schema_mongoose.Schema({
    id: { type: Number }, // 
    name: { type: String }, // 
    emailid: { type: String }, // 
    pass: { type: String }, // 
    mobile: { type: Number }, // 
    role: { type: String } // 'player', 'coach', 'student', 'teacher' - it handles anything 
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields 
});

module.exports = schema_mongoose.model('person_collection', PersonSchema); //