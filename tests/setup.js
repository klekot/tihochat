// Test setup file

// Mock config module
jest.mock('config', () => ({
  get: jest.fn((key) => {
    const config = {
      'db.host': 'localhost',
      'db.user': 'test_user',
      'db.password': 'test_password',
      'db.database': 'test_database',
      'session.secret': 'test_secret',
      'ssl.key': './test-key.pem',
      'ssl.cert': './test-cert.pem',
      'default.password': 'default_password'
    };
    return config[key];
  })
}));

// Mock fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn(() => 'mock-cert-content'),
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  rename: jest.fn((src, dest, callback) => callback(null)),
  unlink: jest.fn((path, callback) => callback(null))
}));

// Mock mysql module
jest.mock('mysql', () => ({
  createConnection: jest.fn(() => ({
    connect: jest.fn((callback) => callback(null)),
    query: jest.fn((sql, params, callback) => {
      if (callback) {
        callback(null, [], []);
      }
    }),
    end: jest.fn((callback) => callback(null))
  }))
}));

// Mock express-mysql-session
jest.mock('express-mysql-session', () => {
  return jest.fn(() => ({
    onReady: jest.fn(() => Promise.resolve()),
    close: jest.fn(() => Promise.resolve())
  }));
});

// Global test timeout
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
