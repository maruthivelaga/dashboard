const mongoose = require('mongoose');

const WorkflowStepSchema = new mongoose.Schema({
  stepNumber: { type: Number, required: true },
  stepTitle: { type: String, required: true },
  description: { type: String, required: true }
});

const ReviewSchema = new mongoose.Schema({
  problemRelevance: { type: Number, default: 0 },
  agenticReasoning: { type: Number, default: 0 },
  technicalFeasibility: { type: Number, default: 0 },
  innovation: { type: Number, default: 0 },
  usefulness: { type: Number, default: 0 },
  humanOversight: { type: Number, default: 0 },
  demoReadiness: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  reviewerComments: { type: String, default: '' },
  internalNotes: { type: String, default: '' },
  shortlisted: { type: Boolean, default: false },
  reviewedAt: { type: Date }
});

const SubmissionSchema = new mongoose.Schema({
  submissionId: {
    type: String,
    required: true,
    unique: true
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
  members: [{
    registrationNo: String,
    name: String,
    year: String,
    section: String
  }],
  agentName: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['Education', 'Healthcare', 'Finance', 'Cybersecurity', 'Productivity', 'Automation', 'Other'],
    default: 'Other'
  },
  problemStatement: {
    type: String,
    default: ''
  },
  targetUsers: {
    type: String,
    default: ''
  },
  userInputs: {
    type: String,
    default: ''
  },
  informationSources: {
    type: String,
    default: ''
  },
  decisions: {
    type: String,
    default: ''
  },
  tools: {
    type: [String],
    default: []
  },
  workflowSteps: [WorkflowStepSchema],
  expectedResult: {
    type: String,
    default: ''
  },
  successMetrics: {
    type: String,
    default: ''
  },
  risks: {
    type: String,
    default: ''
  },
  humanOversight: {
    type: String,
    default: ''
  },
  githubUrl: {
    type: String,
    default: ''
  },
  demoUrl: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Under Review', 'Reviewed', 'Shortlisted'],
    default: 'Draft'
  },
  review: {
    type: ReviewSchema,
    default: () => ({})
  }
}, { timestamps: true });

module.exports = mongoose.model('Submission', SubmissionSchema);
