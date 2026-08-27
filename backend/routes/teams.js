const express = require('express');
const router = express.Router();
const Team = require('../models/Team');

// @route   GET /api/teams
// @desc    Get all teams with search, filter, and sorting
router.get('/', async (req, res) => {
  try {
    const { search, year, section, status, shortlisted } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { agentName: { $regex: search, $options: 'i' } }
      ];
    }

    if (year) {
      query.year = year;
    }
    if (section) {
      query.section = section;
    }
    if (status) {
      query.submissionStatus = status;
    }
    if (shortlisted) {
      query.shortlisted = shortlisted === 'true';
    }

    const teams = await Team.find(query).sort({ name: 1 });
    res.json(teams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/teams/:id
// @desc    Get single team by ID
router.get('/:id', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    res.json(team);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
