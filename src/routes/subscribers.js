const express = require('express');
const router = express.Router();
const store = require('../store');

/**
 * GET /api/subscribers
 * Retrieve the list of registered subscribers
 */
router.get('/', (req, res) => {
  const subscribers = store.getAllSubscribers();
  return res.status(200).json({
    success: true,
    count: subscribers.length,
    data: subscribers
  });
});

/**
 * POST /api/subscribers
 * Register a new subscriber
 */
router.post('/', (req, res) => {
  try {
    const { id, name, plan, activationDate } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Subscriber name is required.'
      });
    }

    const newSub = store.addSubscriber({ id, name, plan, activationDate });
    return res.status(201).json({
      success: true,
      message: 'Subscriber registered successfully.',
      data: newSub
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * PATCH /api/subscribers/:id/plan
 * Update a subscriber's plan (e.g. Basic -> Premium)
 */
router.patch('/:id/plan', (req, res) => {
  const { id } = req.params;
  const { plan } = req.body;

  if (!plan) {
    return res.status(400).json({
      success: false,
      error: 'Field "plan" is required (e.g., Basic, Premium, Family).'
    });
  }

  const updated = store.updateSubscriberPlan(id, plan);
  if (!updated) {
    return res.status(404).json({
      success: false,
      error: `Subscriber with ID "${id}" was not found.`
    });
  }

  return res.status(200).json({
    success: true,
    message: `Subscriber ${id} plan updated to ${plan}.`,
    data: updated
  });
});

module.exports = router;
