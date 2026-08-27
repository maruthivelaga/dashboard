const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const Team = require('../models/Team');
const Participant = require('../models/Participant');
const { auth } = require('./auth');

// Helper to generate a random 4-digit ID
const generateUniqueSubId = async () => {
  let unique = false;
  let subId = '';
  while (!unique) {
    const rand = Math.floor(1000 + Math.random() * 9000); // 1000-9999
    subId = `AGX-2026-${rand}`;
    const existing = await Submission.findOne({ submissionId: subId });
    if (!existing) {
      unique = true;
    }
  }
  return subId;
};

// @route   GET /api/submissions
// @desc    Get all submissions with search, filters, sorting, and pagination
router.get('/', async (req, res) => {
  try {
    const {
      search,
      year,
      section,
      status,
      category,
      tool,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    const query = {};

    // Don't show Drafts in standard admin view unless explicitly queried or we include everything.
    // The prompt says Admin dashboard shows "Draft Submissions" and Submissions page allows filtering by status.
    // So we include all.
    
    // Search filter
    if (search) {
      query.$or = [
        { submissionId: { $regex: search, $options: 'i' } },
        { teamName: { $regex: search, $options: 'i' } },
        { agentName: { $regex: search, $options: 'i' } }
      ];
    }

    // Exact match filters
    if (year) {
      query['members.year'] = year;
    }
    if (section) {
      query['members.section'] = section;
    }
    if (status) {
      query.status = status;
    }
    if (category) {
      query.category = category;
    }
    if (tool) {
      query.tools = tool;
    }

    // Count total documents for pagination
    const totalDocs = await Submission.countDocuments(query);

    // Calculate skip
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skipNum = (pageNum - 1) * limitNum;

    // Sorting
    const sort = {};
    if (sortBy === 'submissionDate' || sortBy === 'createdAt') {
      sort.createdAt = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'score') {
      sort['review.averageScore'] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    const submissions = await Submission.find(query)
      .sort(sort)
      .skip(skipNum)
      .limit(limitNum);

    res.json({
      submissions,
      pagination: {
        totalItems: totalDocs,
        totalPages: Math.ceil(totalDocs / limitNum),
        currentPage: pageNum,
        limit: limitNum
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/submissions/:id
// @desc    Get submission detail by ID (or submissionId)
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const mongoose = require('mongoose');
    let submission = null;
    
    if (mongoose.Types.ObjectId.isValid(id)) {
      submission = await Submission.findById(id).populate('teamId');
    }
    
    if (!submission) {
      // Try searching by submissionId (AGX-2026-XXXX)
      submission = await Submission.findOne({ submissionId: id }).populate('teamId');
    }

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.json(submission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/submissions/draft
// @desc    Autosave draft submission (creates or updates draft)
router.post('/draft', async (req, res) => {
  try {
    const {
      submissionId,
      teamName,
      members,
      agentName,
      category,
      problemStatement,
      targetUsers,
      userInputs,
      informationSources,
      decisions,
      tools,
      workflowSteps,
      expectedResult,
      successMetrics,
      risks,
      humanOversight,
      githubUrl,
      demoUrl
    } = req.body;

    if (!teamName) {
      return res.status(400).json({ message: 'Team Name is required to save a draft.' });
    }

    let team;
    let submission;

    // Check if team already exists by teamName (or by submissionId if provided)
    if (submissionId) {
      submission = await Submission.findOne({ submissionId });
      if (submission) {
        team = await Team.findById(submission.teamId);
      }
    }

    if (!team) {
      // Try finding team by name
      team = await Team.findOne({ name: teamName });
    }

    // Determine year/section from first member if available
    const primaryMember = (members && members.length > 0) ? members[0] : null;
    const year = primaryMember ? primaryMember.year : '';
    const section = primaryMember ? primaryMember.section : '';

    if (!team) {
      // Create new Team in draft status
      team = new Team({
        name: teamName,
        members: members || [],
        year,
        section,
        agentName: agentName || '',
        submissionStatus: 'Draft'
      });
      await team.save();
    } else {
      // Update existing team
      team.name = teamName;
      team.members = members || [];
      team.year = year;
      team.section = section;
      team.agentName = agentName || '';
      team.submissionStatus = 'Draft';
      await team.save();
    }

    // Upsert Participants
    // Clear old participants for this team first, to avoid duplicates
    await Participant.deleteMany({ teamId: team._id });
    if (members && members.length > 0) {
      for (const m of members) {
        if (m.registrationNo && m.name) {
          await Participant.create({
            registrationNo: m.registrationNo,
            name: m.name,
            teamId: team._id,
            teamName: team.name,
            year: m.year || year,
            section: m.section || section,
            agentName: agentName || '',
            submissionStatus: 'Draft'
          });
        }
      }
    }

    let activeSubId = submissionId;
    if (!submission) {
      // Generate new submissionId
      activeSubId = await generateUniqueSubId();
      submission = new Submission({
        submissionId: activeSubId,
        teamId: team._id,
        teamName: team.name,
        members: members || [],
        agentName: agentName || '',
        category: category || 'Other',
        problemStatement: problemStatement || '',
        targetUsers: targetUsers || '',
        userInputs: userInputs || '',
        informationSources: informationSources || '',
        decisions: decisions || '',
        tools: tools || [],
        workflowSteps: workflowSteps || [],
        expectedResult: expectedResult || '',
        successMetrics: successMetrics || '',
        risks: risks || '',
        humanOversight: humanOversight || '',
        githubUrl: githubUrl || '',
        demoUrl: demoUrl || '',
        status: 'Draft'
      });
    } else {
      // Update existing submission
      submission.teamName = team.name;
      submission.members = members || [];
      submission.agentName = agentName || '';
      submission.category = category || 'Other';
      submission.problemStatement = problemStatement || '';
      submission.targetUsers = targetUsers || '';
      submission.userInputs = userInputs || '';
      submission.informationSources = informationSources || '';
      submission.decisions = decisions || '';
      submission.tools = tools || [];
      submission.workflowSteps = workflowSteps || [];
      submission.expectedResult = expectedResult || '';
      submission.successMetrics = successMetrics || '';
      submission.risks = risks || '';
      submission.humanOversight = humanOversight || '';
      submission.githubUrl = githubUrl || '';
      submission.demoUrl = demoUrl || '';
      submission.status = 'Draft';
    }

    await submission.save();

    res.json({
      message: 'Draft saved successfully',
      submissionId: activeSubId,
      status: 'Draft',
      updatedAt: submission.updatedAt
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error saving draft' });
  }
});

// @route   POST /api/submissions/submit
// @desc    Submit final project (requires full validation)
router.post('/submit', async (req, res) => {
  try {
    const {
      submissionId,
      teamName,
      members,
      agentName,
      category,
      problemStatement,
      targetUsers,
      userInputs,
      informationSources,
      decisions,
      tools,
      workflowSteps,
      expectedResult,
      successMetrics,
      risks,
      humanOversight,
      githubUrl,
      demoUrl
    } = req.body;

    // Server-side validation
    if (!teamName || !agentName || !problemStatement || !targetUsers || !userInputs || !informationSources || !decisions || !expectedResult || !successMetrics || !risks || !humanOversight || !githubUrl || !demoUrl) {
      return res.status(400).json({ message: 'All fields are required for final submission.' });
    }

    if (!members || members.length === 0) {
      return res.status(400).json({ message: 'At least one team member is required.' });
    }

    // Validate members fields
    for (const m of members) {
      if (!m.registrationNo || !m.name || !m.year || !m.section) {
        return res.status(400).json({ message: 'All team member fields (Registration No, Name, Year, Section) are required.' });
      }
    }

    // Simple URL regex validation
    const urlRegex = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;
    if (!urlRegex.test(githubUrl) || !urlRegex.test(demoUrl)) {
      return res.status(400).json({ message: 'Please enter valid URLs for GitHub and Demo links.' });
    }

    let team;
    let submission;

    if (submissionId) {
      submission = await Submission.findOne({ submissionId });
      if (submission) {
        team = await Team.findById(submission.teamId);
      }
    }

    if (!team) {
      team = await Team.findOne({ name: teamName });
    }

    const primaryMember = members[0];
    const year = primaryMember.year;
    const section = primaryMember.section;

    if (!team) {
      team = new Team({
        name: teamName,
        members,
        year,
        section,
        agentName,
        submissionStatus: 'Submitted'
      });
    } else {
      team.name = teamName;
      team.members = members;
      team.year = year;
      team.section = section;
      team.agentName = agentName;
      team.submissionStatus = 'Submitted';
    }
    await team.save();

    // Save/Update Participants
    await Participant.deleteMany({ teamId: team._id });
    for (const m of members) {
      await Participant.create({
        registrationNo: m.registrationNo,
        name: m.name,
        teamId: team._id,
        teamName: team.name,
        year: m.year,
        section: m.section,
        agentName,
        submissionStatus: 'Submitted'
      });
    }

    let activeSubId = submissionId;
    if (!submission) {
      activeSubId = await generateUniqueSubId();
      submission = new Submission({
        submissionId: activeSubId,
        teamId: team._id,
        teamName: team.name,
        members,
        agentName,
        category: category || 'Other',
        problemStatement,
        targetUsers,
        userInputs,
        informationSources,
        decisions,
        tools: tools || [],
        workflowSteps: workflowSteps || [],
        expectedResult,
        successMetrics,
        risks,
        humanOversight,
        githubUrl,
        demoUrl,
        status: 'Submitted'
      });
    } else {
      submission.teamName = team.name;
      submission.members = members;
      submission.agentName = agentName;
      submission.category = category || 'Other';
      submission.problemStatement = problemStatement;
      submission.targetUsers = targetUsers;
      submission.userInputs = userInputs;
      submission.informationSources = informationSources;
      submission.decisions = decisions;
      submission.tools = tools || [];
      submission.workflowSteps = workflowSteps || [];
      submission.expectedResult = expectedResult;
      submission.successMetrics = successMetrics;
      submission.risks = risks;
      submission.humanOversight = humanOversight;
      submission.githubUrl = githubUrl;
      submission.demoUrl = demoUrl;
      submission.status = 'Submitted';
    }

    await submission.save();

    res.json({
      message: 'Project submitted successfully',
      submissionId: activeSubId,
      teamName: team.name,
      submittedDate: submission.updatedAt,
      status: 'Submitted'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during submission' });
  }
});

// @route   PUT /api/submissions/:id/review
// @desc    Submit evaluation score for a project (Admin only)
router.put('/:id/review', auth, async (req, res) => {
  try {
    const {
      problemRelevance,
      agenticReasoning,
      technicalFeasibility,
      innovation,
      usefulness,
      humanOversight,
      demoReadiness,
      reviewerComments,
      internalNotes,
      shortlisted
    } = req.body;

    const sub = await Submission.findById(req.params.id);
    if (!sub) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Calculate score
    const total = 
      Number(problemRelevance) + 
      Number(agenticReasoning) + 
      Number(technicalFeasibility) + 
      Number(innovation) + 
      Number(usefulness) + 
      Number(humanOversight) + 
      Number(demoReadiness);

    const average = Math.round((total / 7) * 10) / 10; // round to 1 decimal

    // Determine status update
    // If we review, status is either 'Reviewed' or 'Shortlisted' depending on shortlisted check
    const statusUpdate = shortlisted ? 'Shortlisted' : 'Reviewed';

    sub.review = {
      problemRelevance: Number(problemRelevance),
      agenticReasoning: Number(agenticReasoning),
      technicalFeasibility: Number(technicalFeasibility),
      innovation: Number(innovation),
      usefulness: Number(usefulness),
      humanOversight: Number(humanOversight),
      demoReadiness: Number(demoReadiness),
      totalScore: total,
      averageScore: average,
      reviewerComments: reviewerComments || '',
      internalNotes: internalNotes || '',
      shortlisted: !!shortlisted,
      reviewedAt: new Date()
    };
    sub.status = statusUpdate;
    await sub.save();

    // Sync status and score back to Team
    const team = await Team.findById(sub.teamId);
    if (team) {
      team.submissionStatus = statusUpdate;
      team.score = average;
      team.shortlisted = !!shortlisted;
      await team.save();
    }

    // Sync status to Participants
    await Participant.updateMany(
      { teamId: sub.teamId },
      { submissionStatus: statusUpdate }
    );

    res.json({
      message: 'Review saved successfully',
      submission: sub
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error saving review' });
  }
});

// @route   PUT /api/submissions/:id/status
// @desc    Mark project status (e.g. Under Review, Shortlisted)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Draft', 'Submitted', 'Under Review', 'Reviewed', 'Shortlisted'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const sub = await Submission.findById(req.params.id);
    if (!sub) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    sub.status = status;
    if (status === 'Shortlisted') {
      sub.review.shortlisted = true;
    } else if (status === 'Reviewed') {
      // keep review shortlisted as is or false
    } else {
      sub.review.shortlisted = false;
    }
    await sub.save();

    // Sync to Team
    const team = await Team.findById(sub.teamId);
    if (team) {
      team.submissionStatus = status;
      team.shortlisted = (status === 'Shortlisted');
      await team.save();
    }

    // Sync to Participants
    await Participant.updateMany(
      { teamId: sub.teamId },
      { submissionStatus: status }
    );

    res.json({
      message: `Status updated to ${status} successfully`,
      submission: sub
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
