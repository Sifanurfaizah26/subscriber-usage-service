const express = require('express');
const router = express.Router();
const store = require('../store');

/**
 * GET /api/stats/overview
 * Overall statistics & KPIs
 */
router.get('/overview', (req, res) => {
  const summary = store.getOverallSummary();
  return res.status(200).json({
    success: true,
    data: summary
  });
});

/**
 * POST /api/stats/reset
 * Reset in-memory store back to initial seed data
 */
router.post('/reset', (req, res) => {
  store.reset();
  return res.status(200).json({
    success: true,
    message: 'Store has been reset to original test seed data.'
  });
});

module.exports = router;
