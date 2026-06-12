const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/db');
const mockUsers = require('./mockAuth');
const { JWT_SECRET } = require('../../middleware/auth');

const mockNotifications = [];

const ALLOWED_ROLES = ['Patient', 'Health Specialist'];

// Helper function to check if we should use mock auth
const useMockAuth = () => global.dbActive === false;

function normalizeRole(role) {
  return ALLOWED_ROLES.includes(role) ? role : 'Patient';
}

function setSessionCookie(res, token, rememberMe) {
  res.cookie('prescrypto_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
  });
}

async function register(req, res) {
  try {
    const { email, password, name, role, preferredLanguage } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Use mock auth if database is unavailable
    if (useMockAuth()) {
      if (mockUsers.has(email)) {
        return res.status(400).json({ error: 'User with this email already exists (Mock Mode)' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const userId = `user-${Date.now()}`;
      const newUser = {
        id: userId,
        email,
        passwordHash, // Store securely hashed password in mock mode
        name,
        role: normalizeRole(role),
        preferredLanguage: preferredLanguage || 'en'
      };

      mockUsers.set(email, newUser);

      return res.status(201).json({
        success: true,
        message: 'Account created successfully. Please login.'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: normalizeRole(role),
        preferredLanguage: preferredLanguage || 'en'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please login.'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
}

async function login(req, res) {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Use mock auth if database is unavailable
    if (useMockAuth()) {
      const user = mockUsers.get(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password (Mock Mode)' });
      }

      const isMatch = user.passwordHash
        ? await bcrypt.compare(password, user.passwordHash)
        : user.password === password;

      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password (Mock Mode)' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        JWT_SECRET,
        { expiresIn: rememberMe ? '30d' : '1d' }
      );
      setSessionCookie(res, token, rememberMe);

      return res.status(200).json({
        message: 'Login successful (Mock Mode)',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          preferredLanguage: user.preferredLanguage
        }
      });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: rememberMe ? '30d' : '1d' }
    );
    setSessionCookie(res, token, rememberMe);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        preferredLanguage: user.preferredLanguage
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
}

async function getMe(req, res) {
  try {
    // Use mock auth if database is unavailable
    if (useMockAuth()) {
      const user = Array.from(mockUsers.values()).find(u => u.id === req.user.id || u.email === req.user.email);
      if (user) {
        return res.status(200).json({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            preferredLanguage: user.preferredLanguage || 'en'
          }
        });
      }
      return res.status(200).json({
        user: {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name || 'Mock User',
          role: req.user.role,
          preferredLanguage: 'en'
        }
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        preferredLanguage: user.preferredLanguage
      }
    });
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({ error: 'Internal server error fetching user data' });
  }
}

function logout(req, res) {
  res.clearCookie('prescrypto_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    let userExists = false;
    let userName = '';

    if (useMockAuth()) {
      if (mockUsers.has(email)) {
        userExists = true;
        userName = mockUsers.get(email).name;
      }
    } else {
      const user = await prisma.user.findUnique({
        where: { email }
      });
      if (user) {
        userExists = true;
        userName = user.name;
      }
    }

    if (!userExists) {
      return res.status(200).json({ message: 'If the email exists, a reset link has been sent.' });
    }

    const nodemailer = require('nodemailer');
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    const resetLink = `http://localhost:3000/reset-password?email=${encodeURIComponent(email)}&token=mock-reset-token`;

    if (smtpHost && smtpPort && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(smtpPort),
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        });

        await transporter.sendMail({
          from: `"Prescrypto Support" <${smtpUser}>`,
          to: email,
          subject: 'Password Reset Request',
          text: `Hello ${userName},\n\nYou requested a password reset. Please click the following link to reset your password:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.`,
          html: `<p>Hello ${userName},</p><p>You requested a password reset. Please click the link below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you did not request this, please ignore this email.</p>`
        });
        console.log(`Password reset email sent to ${email}`);
      } catch (err) {
        console.error('Failed to send email via SMTP, falling back to console logging:', err);
        console.log(`[PASSWORD RESET LINK FOR ${email}]: ${resetLink}`);
      }
    } else {
      console.log(`SMTP parameters missing. [PASSWORD RESET LINK FOR ${email}]: ${resetLink}`);
    }

    return res.status(200).json({ message: 'If the email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('ForgotPassword error:', error);
    res.status(500).json({ error: 'Internal server error during password reset request' });
  }
}

async function getNotifications(req, res) {
  try {
    if (global.dbActive === false) {
      const userNotifications = mockNotifications.filter(n => n.userId === req.user.id);
      return res.status(200).json({ notifications: userNotifications });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ notifications });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

async function markNotificationsRead(req, res) {
  try {
    if (global.dbActive === false) {
      mockNotifications.forEach(n => {
        if (n.userId === req.user.id) {
          n.read = true;
        }
      });
      return res.status(200).json({ success: true, message: 'All notifications marked as read (Mock Mode).' });
    }

    await prisma.notification.updateMany({
      where: { userId: req.user.id },
      data: { read: true }
    });

    res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Error marking notifications read:', err);
    res.status(500).json({ error: 'Failed to mark notifications read' });
  }
}

async function deleteNotification(req, res) {
  try {
    const { id } = req.params;

    if (global.dbActive === false) {
      const idx = mockNotifications.findIndex(n => n.id === id && n.userId === req.user.id);
      if (idx !== -1) {
        mockNotifications.splice(idx, 1);
      }
      return res.status(200).json({ success: true, message: 'Notification deleted (Mock Mode).' });
    }

    const notif = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notif || notif.userId !== req.user.id) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await prisma.notification.delete({
      where: { id }
    });

    res.status(200).json({ success: true, message: 'Notification deleted successfully.' });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
}

async function createNotification({ userId, type, title, body }) {
  try {
    if (global.dbActive === false) {
      const notif = {
        id: `mock-notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: type || 'info',
        title,
        body,
        read: false,
        createdAt: new Date()
      };
      mockNotifications.unshift(notif);
      return notif;
    }

    return await prisma.notification.create({
      data: {
        userId,
        type: type || 'info',
        title,
        body
      }
    });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
}

module.exports = {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  getNotifications,
  markNotificationsRead,
  deleteNotification,
  createNotification
};
