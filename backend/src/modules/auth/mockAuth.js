// Mock in-memory user storage for development without database
const mockUsers = new Map();

// Pre-populated demo users — roles MUST match the canonical role strings
// used throughout the app: 'Patient' or 'Health Specialist'
mockUsers.set('patient@example.com', {
  id: 'demo-patient-1',
  email: 'patient@example.com',
  password: 'password123',
  name: 'Demo Patient',
  role: 'Patient',
  preferredLanguage: 'en'
});

mockUsers.set('specialist@example.com', {
  id: 'demo-specialist-1',
  email: 'specialist@example.com',
  password: 'specialist123',
  name: 'Dr. Demo Specialist',
  role: 'Health Specialist',
  preferredLanguage: 'en'
});

module.exports = mockUsers;
