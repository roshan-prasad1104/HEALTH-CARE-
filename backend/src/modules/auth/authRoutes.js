const express = require('express');
const router = express.Router();
const { register, login, logout, getMe, forgotPassword, getNotifications, markNotificationsRead, deleteNotification } = require('./authController');
const { authenticateToken } = require('../../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.get('/me', authenticateToken, getMe);

router.get('/notifications', authenticateToken, getNotifications);
router.post('/notifications/read-all', authenticateToken, markNotificationsRead);
router.delete('/notifications/:id', authenticateToken, deleteNotification);

module.exports = router;
