const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
  registrationNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  teamName: {
    type: String,
    required: true
  },
  year: {
    type: String,
    required: true
  },
  section: {
    type: String,
    required: true
  },
  agentName: {
    type: String
  },
  submissionStatus: {
    type: String,
    enum: ['Draft', 'Submitted', 'Under Review', 'Reviewed', 'Shortlisted'],
    default: 'Draft'
  }
}, { timestamps: true });

module.exports = mongoose.model('Participant', ParticipantSchema);
