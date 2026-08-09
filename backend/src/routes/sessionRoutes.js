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

// POST /api/admin/session/start — Start new configurable session (Admin Only)
router.post('/admin/session/start', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const durationMinutes = parseInt(req.body.durationMinutes, 10) || 180;
    const liquidationBufferMinutes = parseInt(req.body.liquidationBufferMinutes, 10) || 5;
    const macroCycleIntervalMinutes = parseInt(req.body.macroCycleIntervalMinutes, 10) || 15;

    const session = await startNewSession({
      durationMinutes,
      liquidationBufferMinutes,
      macroCycleIntervalMinutes
    });

    return res.json({
      message: `Started new ${durationMinutes}-minute trading session (Liquidation buffer: ${liquidationBufferMinutes}m, Macro cycle: ${macroCycleIntervalMinutes}m)!`,
      session
    });
  } catch (err) {
    console.error('Error starting new session:', err);
    return res.status(500).json({ error: 'Failed to start session' });
  }
});

module.exports = router;
