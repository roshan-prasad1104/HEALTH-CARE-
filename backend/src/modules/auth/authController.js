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

      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, role: newUser.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(201).json({
        message: 'User registered successfully (Mock Mode)',
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          preferredLanguage: newUser.preferredLanguage
        }
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

    // Create token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        preferredLanguage: newUser.preferredLanguage
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

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
        { expiresIn: '24h' }
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
      { expiresIn: '24h' }
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

module.exports = {
  register,
  login,
  getMe
};
