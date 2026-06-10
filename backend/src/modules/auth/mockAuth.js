// Mock in-memory user storage for development without database
const mockUsers = new Map();

// Pre-populated test users
mockUsers.set('test@example.com', {
  id: 'test-user-1',
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  role: 'USER',
  preferredLanguage: 'en'
});

mockUsers.set('admin@example.com', {
  id: 'admin-user-1',
  email: 'admin@example.com',
  password: 'admin123',
  name: 'Admin User',
  role: 'ADMIN',
  preferredLanguage: 'en'
});

module.exports = mockUsers;
