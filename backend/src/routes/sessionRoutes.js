const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const { getCurrentSession, startNewSession } = require('../services/sessionService');

const router = express.Router();

// GET /api/session — Server-authoritative session status & countdown
router.get('/session', async (req, res) => {
  try {
    const session = await getCurrentSession();
    return res.json(session);
  } catch (err) {
    console.error('Error fetching session:', err);
    return res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// POST /api/admin/session/start — Start new 3-hour session (Admin Only)
router.post('/admin/session/start', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const durationHours = parseInt(req.body.durationHours, 10) || 3;
    const session = await startNewSession(durationHours);
    return res.json({
      message: `Started new ${durationHours}-hour trading session successfully!`,
      session
    });
  } catch (err) {
    console.error('Error starting new session:', err);
    return res.status(500).json({ error: 'Failed to start session' });
  }
});

module.exports = router;
