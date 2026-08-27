const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const Participant = require('../models/Participant');
const Submission = require('../models/Submission');

// @route   GET /api/analytics
// @desc    Get dashboard KPIs and aggregated data for charts
router.get('/', async (req, res) => {
  try {
    // 1. KPIs
    const totalTeams = await Team.countDocuments();
    const totalParticipants = await Participant.countDocuments();
    
    // Submissions are any submission records that are not drafts
    const projectsSubmitted = await Submission.countDocuments({ status: { $ne: 'Draft' } });
    const draftSubmissions = await Submission.countDocuments({ status: 'Draft' });
    
    // Reviewed projects = status Reviewed OR Shortlisted
    const reviewedProjects = await Submission.countDocuments({ status: { $in: ['Reviewed', 'Shortlisted'] } });
    const shortlistedProjects = await Submission.countDocuments({ status: 'Shortlisted' });

    // 2. Projects by Year
    // Since years are strings like '1st Year', '2nd Year', we can aggregate
    const yearAggregation = await Team.aggregate([
      { $group: { _id: '$year', count: { $sum: 1 } } }
    ]);
    const projectsByYear = {};
    yearAggregation.forEach(item => {
      if (item._id) projectsByYear[item._id] = item.count;
    });

    // 3. Projects by Section
    const sectionAggregation = await Team.aggregate([
      { $group: { _id: '$section', count: { $sum: 1 } } }
    ]);
    const projectsBySection = {};
    sectionAggregation.forEach(item => {
      if (item._id) projectsBySection[item._id] = item.count;
    });

    // 4. Submission Status (Submitted, Under Review, Reviewed, Shortlisted)
    const statusAggregation = await Submission.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const submissionStatus = {
      'Submitted': 0,
      'Under Review': 0,
      'Reviewed': 0,
      'Shortlisted': 0
    };
    statusAggregation.forEach(item => {
      if (item._id in submissionStatus) {
        submissionStatus[item._id] = item.count;
      }
    });

    // 5. Agent Categories
    const categoryAggregation = await Submission.aggregate([
      { $match: { status: { $ne: 'Draft' } } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const agentCategories = {};
    categoryAggregation.forEach(item => {
      if (item._id) agentCategories[item._id] = item.count;
    });

    // 6. Tool Usage (count frequency of tools in the array)
    const toolAggregation = await Submission.aggregate([
      { $match: { status: { $ne: 'Draft' } } },
      { $unwind: '$tools' },
      { $group: { _id: '$tools', count: { $sum: 1 } } }
    ]);
    const toolUsage = {};
    toolAggregation.forEach(item => {
      if (item._id) toolUsage[item._id] = item.count;
    });

    res.json({
      kpis: {
        totalTeams,
        totalParticipants,
        projectsSubmitted,
        draftSubmissions,
        reviewedProjects,
        shortlistedProjects
      },
      charts: {
        projectsByYear,
        projectsBySection,
        submissionStatus,
        agentCategories,
        toolUsage
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving analytics' });
  }
});

module.exports = router;
