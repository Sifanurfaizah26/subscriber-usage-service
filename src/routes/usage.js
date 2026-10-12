const express = require('express');
const router = express.Router();
const store = require('../store');

/**
 * POST /api/usage
 * Record subscriber usage
 * Request Body:
 * {
 *   "subscriberId": "SUB01",
 *   "callMinutes": 45,
 *   "smsCount": 12,
 *   "dataUsageMB": 2048,
 *   "timestamp": "2025-08-01T14:00:00Z" (optional, defaults to now)
 * }
 */
router.post('/', (req, res) => {
  try {
    const { subscriberId, callMinutes, smsCount, dataUsageMB, timestamp } = req.body;

    if (!subscriberId || callMinutes === undefined || smsCount === undefined || dataUsageMB === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields. Please provide: subscriberId, callMinutes, smsCount, dataUsageMB.'
      });
    }

    const newRecord = store.recordUsage({
      subscriberId,
      callMinutes,
      smsCount,
      dataUsageMB,
      timestamp
    });

    return res.status(201).json({
      success: true,
      message: 'Subscriber usage recorded successfully.',
      data: newRecord
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/usage
 * Retrieve all usage records
 * Optional Query Params:
 * - subscriberId: filter by subscriber ID (e.g., ?subscriberId=SUB01)
 * - limit: max records to return (e.g., ?limit=10)
 * - sortBy: field to sort by (e.g., ?sortBy=dataUsageMB)
 * - order: "asc" or "desc" (default: "desc")
 */
router.get('/', (req, res) => {
  try {
    const { subscriberId, limit, sortBy, order } = req.query;
    const records = store.getAllUsageRecords({ subscriberId, limit, sortBy, order });

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while fetching usage records.'
    });
  }
});

/**
 * GET /api/usage/:subscriberId
 * Retrieve detailed usage history and aggregated totals for a specific subscriber
 */
router.get('/:subscriberId', (req, res) => {
  try {
    const { subscriberId } = req.params;
    const summary = store.getSubscriberSummary(subscriberId);

    return res.status(200).json({
      success: true,
      data: summary
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while fetching subscriber usage.'
    });
  }
});

module.exports = router;
