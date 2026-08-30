const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { generateToken } = require('../utils/auth');
const { authenticateToken } = require('../middleware/authMiddleware');
const { adminLoginRateLimiter, recordAdminFailedAttempt, clearAdminRateLimit } = require('../middleware/rateLimiter');

const router = express.Router();
const prisma = new PrismaClient();

// POST /auth/register (Disabled — Roster pre-loading only)
router.post('/register', async (req, res) => {
  return res.status(403).json({ error: "Self-registration is disabled. Please ask your event administrator to add you to the roster." });
});

// POST /auth/login (Trader Roster Login via Email + Phone Number)
router.post('/login', async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    const inputCredential = String(phone || password || '').trim();

    if (!email || !email.trim() || !inputCredential) {
      return res.status(400).json({ error: 'Email and phone number are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = inputCredential.replace(/\D/g, '');

    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      return res.status(400).json({ error: "You are not registered for this event — ask your admin." });
    }
    if (user.role === 'ADMIN') {
      return res.status(401).json({ error: 'Invalid email or phone number' });
    }

    let isMatch = Boolean(cleanPhone && user.phone && user.phone === cleanPhone);
    if (!isMatch) {
      isMatch = user.passwordHash === inputCredential;
    }
    if (!isMatch) {
      isMatch = await bcrypt.compare(inputCredential, user.passwordHash).catch(() => false);
    }
    if (!isMatch && cleanPhone) {
      isMatch = await bcrypt.compare(cleanPhone, user.passwordHash).catch(() => false);
    }

    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect phone number.' });
    }

    if (!user.hasLoggedIn) {
      await prisma.user.update({
        where: { id: user.id },
        data: { hasLoggedIn: true }
      });
    }

    const token = generateToken(user);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        walletBalance: user.walletBalance,
        hasLoggedIn: true
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
      return res.status(401).json({ error: 'User not found or session expired' });
    }

    return res.json({ user });
  } catch (err) {
    console.error('Get current user error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
