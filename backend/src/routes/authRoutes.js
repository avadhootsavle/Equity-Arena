const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { generateToken } = require('../utils/auth');
const { authenticateToken } = require('../middleware/authMiddleware');
const { adminLoginRateLimiter, recordAdminFailedAttempt, clearAdminRateLimit } = require('../middleware/rateLimiter');

const router = express.Router();
const prisma = new PrismaClient();

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash: password,
        role: 'TRADER',
        walletBalance: 20000
      }
    });

    const token = generateToken(user);

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/login (Public Trader Login)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || user.role === 'ADMIN') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    let isMatch = user.passwordHash === password;
    if (!isMatch) {
      isMatch = await bcrypt.compare(password, user.passwordHash).catch(() => false);
    }
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance
      }
    });
  } catch (err) {
    console.error('Trader login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const safeLogAdminAudit = async (data) => {
  try {
    if (prisma.adminAuditLog) {
      await prisma.adminAuditLog.create({ data });
    }
  } catch (err) {
    console.error('Admin audit log error:', err.message);
  }
};

// Admin Login Handler (handles both /auth/admin/login and /auth/admin-login)
const handleAdminLogin = async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const emailInput = req.body.email ? req.body.email.trim().toLowerCase() : '';
  const passwordInput = req.body.password || '';

  try {
    if (!emailInput || !passwordInput) {
      recordAdminFailedAttempt(ipAddress);
      await safeLogAdminAudit({
        email: emailInput || 'UNKNOWN',
        ipAddress,
        status: 'FAILED',
        details: 'Missing email or password'
      });
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email: emailInput } });

    if (!user || user.role !== 'ADMIN') {
      recordAdminFailedAttempt(ipAddress);
      await safeLogAdminAudit({
        email: emailInput,
        ipAddress,
        status: 'FAILED',
        details: 'Invalid credentials or non-admin user'
      });
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    let isMatch = user.passwordHash === passwordInput;
    if (!isMatch) {
      isMatch = await bcrypt.compare(passwordInput, user.passwordHash).catch(() => false);
    }
    if (!isMatch) {
      recordAdminFailedAttempt(ipAddress);
      await safeLogAdminAudit({
        email: emailInput,
        ipAddress,
        status: 'FAILED',
        details: 'Password mismatch'
      });
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // Success! Clear rate limit counter and record audit log
    clearAdminRateLimit(ipAddress);
    await safeLogAdminAudit({
      email: user.email,
      ipAddress,
      status: 'SUCCESS',
      details: 'Admin logged in successfully'
    });

    const token = generateToken(user); // 2-hour Admin JWT

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

router.post('/admin/login', adminLoginRateLimiter, handleAdminLogin);
router.post('/admin-login', adminLoginRateLimiter, handleAdminLogin);

// GET /auth/me — Validate token & return current user info on page reload
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        walletBalance: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (err) {
    console.error('Get current user error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
