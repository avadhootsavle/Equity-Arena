const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const { getCurrentSession, startNewSession, pauseSession, resumeSession, stopSession } = require('../services/sessionService');

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
    const force = Boolean(req.body.force);

    const session = await startNewSession({
      durationMinutes,
      liquidationBufferMinutes,
      macroCycleIntervalMinutes,
      force
    });

    return res.json({
      message: `Started ${durationMinutes}-minute trading session!`,
      session
    });
  } catch (err) {
    console.error('Error starting new session:', err);
    const statusCode = err.status || 500;
    return res.status(statusCode).json({ error: err.message || 'Failed to start session' });
  }
});

// POST /api/admin/session/pause — Pause trading session for configurable break & note (Admin Only)
router.post('/admin/session/pause', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const breakMinutes = parseInt(req.body.breakMinutes || req.body.durationMinutes, 10) || 10;
    const note = req.body.note || req.body.breakNote || '';

    const session = await pauseSession({ breakMinutes, note });
    return res.json({
      message: `Market paused for ${breakMinutes}-minute break! Trading floor locked.`,
      session
    });
  } catch (err) {
    console.error('Error pausing session:', err);
    const statusCode = err.status || 500;
    return res.status(statusCode).json({ error: err.message || 'Failed to pause session' });
  }
});

// POST /api/admin/session/resume — Resume paused trading session (Admin Only)
router.post('/admin/session/resume', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const session = await resumeSession();
    return res.json({
      message: 'Market resumed! Trading floor unlocked.',
      session
    });
  } catch (err) {
    console.error('Error resuming session:', err);
    const statusCode = err.status || 500;
    return res.status(statusCode).json({ error: err.message || 'Failed to resume session' });
  }
});

// POST /api/admin/session/stop — Manually close/stop trading session (Admin Only)
router.post('/admin/session/stop', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const session = await stopSession();
    return res.json({
      message: 'Trading session stopped by Admin. Market closed.',
      session
    });
  } catch (err) {
    console.error('Error stopping session:', err);
    const statusCode = err.status || 500;
    return res.status(statusCode).json({ error: err.message || 'Failed to stop session' });
  }
});

module.exports = router;
