const mongoose = require('mongoose');

const TeamMemberSchema = new mongoose.Schema({
  registrationNo: { type: String, required: true },
  name: { type: String, required: true },
  year: { type: String, required: true },
  section: { type: String, required: true }
});

const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  members: [TeamMemberSchema],
  year: { type: String }, // e.g., "3rd Year" (derived from leader/first member or manual)
  section: { type: String }, // e.g., "A"
  agentName: { type: String },
  submissionStatus: {
    type: String,
    enum: ['Draft', 'Submitted', 'Under Review', 'Reviewed', 'Shortlisted'],
    default: 'Draft'
  },
  score: { type: Number, default: 0 },
  shortlisted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Team', TeamSchema);
