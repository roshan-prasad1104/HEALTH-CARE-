const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/db');
const mockUsers = require('./mockAuth');
const { JWT_SECRET } = require('../../middleware/auth');

// Helper function to check if we should use mock auth
const useMockAuth = () => global.dbActive === false;

async function register(req, res) {
  try {
    const { email, password, name, role, preferredLanguage } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Use mock auth if database is unavailable
    if (useMockAuth()) {
      if (mockUsers.has(email)) {
        return res.status(400).json({ error: 'User with this email already exists (Mock Mode)' });
      }

      const userId = `user-${Date.now()}`;
      const newUser = {
        id: userId,
        email,
        password, // Store plain text in mock mode
        name,
        role: role || 'USER',
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
        role: role || 'USER',
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

      if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid email or password (Mock Mode)' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: rememberMe ? '30d' : '1d' }
      );

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
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: rememberMe ? '30d' : '1d' }
    );

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
      // In mock mode, we'd need to look up by email from token
      // For now, just return a generic response
      return res.status(200).json({
        user: {
          id: req.user.id,
          email: req.user.email,
          name: 'Mock User',
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

module.exports = {
  register,
  login,
  getMe,
  forgotPassword
};
