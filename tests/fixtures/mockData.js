// Test fixtures
const mockUsers = [
  {
    user_id: 1,
    name: 'Test User',
    login: 'testuser',
    password: 'hashed_password',
    avatar: 'avatar.jpg'
  },
  {
    user_id: 2,
    name: 'Another User',
    login: 'anotheruser',
    password: 'hashed_password2',
    avatar: null
  }
];

const mockInvites = [
  {
    invite_id: 1,
    invite_key: 'test-invite-key',
    person: 'Invited Person',
    user_id: null
  },
  {
    invite_id: 2,
    invite_key: 'used-invite-key',
    person: 'Used Person',
    user_id: 1
  }
];

const mockSessionUser = {
  id: 1,
  login: 'testuser',
  name: 'Test User',
  avatar: 'avatar.jpg'
};

module.exports = {
  mockUsers,
  mockInvites,
  mockSessionUser
};
