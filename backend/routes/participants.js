const express = require('express');
const router = express.Router();
const Participant = require('../models/Participant');

// @route   GET /api/participants
// @desc    Get all participants with search and filters
router.get('/', async (req, res) => {
  try {
    const { search, year, section, status } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { registrationNo: { $regex: search, $options: 'i' } },
        { teamName: { $regex: search, $options: 'i' } }
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

    const participants = await Participant.find(query).sort({ registrationNo: 1 });
    res.json(participants);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
