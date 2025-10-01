const db = require('../../src/services/database');
const { mockUsers, mockInvites } = require('../fixtures/mockData');

describe('Database Service', () => {
  let mockConnection;

  beforeEach(() => {
    mockConnection = {
      connect: jest.fn((callback) => callback(null)),
      query: jest.fn((sql, params, callback) => {
        if (callback) {
          callback(null, mockUsers, []);
        }
      }),
      end: jest.fn((callback) => callback(null))
    };
    
    // Mock mysql.createConnection
    const mysql = require('mysql');
    mysql.createConnection.mockReturnValue(mockConnection);
    
    // Reset the database service
    db.connection = mockConnection;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connect', () => {
    it('should connect to database successfully', async () => {
      await expect(db.connect()).resolves.toBeUndefined();
      expect(mockConnection.connect).toHaveBeenCalledTimes(1);
    });

    it('should reject on connection error', async () => {
      const error = new Error('Connection failed');
      mockConnection.connect.mockImplementation((callback) => callback(error));
      
      // Reset connection state to force a new connection attempt
      db.isConnected = false;
      db.connection = null;
      
      await expect(db.connect()).rejects.toThrow('Connection failed');
    });
  });

  describe('query', () => {
    it('should execute query successfully', async () => {
      const result = await db.query('SELECT * FROM users', []);
      expect(result).toEqual(mockUsers);
      expect(mockConnection.query).toHaveBeenCalledWith('SELECT * FROM users', [], expect.any(Function));
    });

    it('should reject on query error', async () => {
      const error = new Error('Query failed');
      mockConnection.query.mockImplementation((sql, params, callback) => {
        callback(error);
      });
      
      await expect(db.query('SELECT * FROM users', [])).rejects.toThrow('Query failed');
    });
  });

  describe('getUserByLogin', () => {
    it('should get user by login and password', async () => {
      const result = await db.getUserByLogin('testuser', 'password');
      expect(result).toEqual(mockUsers);
      expect(mockConnection.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE login = ? AND password = PASSWORD(?)',
        ['testuser', 'password'],
        expect.any(Function)
      );
    });
  });

  describe('getUserById', () => {
    it('should get user by ID', async () => {
      const result = await db.getUserById(1);
      expect(result).toEqual(mockUsers);
      expect(mockConnection.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE user_id = ?',
        [1],
        expect.any(Function)
      );
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const result = await db.createUser('New User', 'newuser', 'password');
      expect(result).toEqual(mockUsers);
      expect(mockConnection.query).toHaveBeenCalledWith(
        'INSERT INTO users (name, login, password) VALUES (?, ?, PASSWORD(?))',
        ['New User', 'newuser', 'password'],
        expect.any(Function)
      );
    });
  });

  describe('updateUser', () => {
    it('should update user with all fields', async () => {
      const updateData = {
        name: 'Updated Name',
        login: 'updatedlogin',
        password: 'newpassword',
        avatar: 'newavatar.jpg'
      };
      
      const result = await db.updateUser(1, updateData);
      expect(result).toEqual(mockUsers);
      expect(mockConnection.query).toHaveBeenCalledWith(
        'UPDATE users SET name = ?, login = ?, password = PASSWORD(?), avatar = ? WHERE user_id = ?',
        ['Updated Name', 'updatedlogin', 'newpassword', 'newavatar.jpg', 1],
        expect.any(Function)
      );
    });

    it('should update user with partial fields', async () => {
      const updateData = {
        name: 'Updated Name'
      };
      
      const result = await db.updateUser(1, updateData);
      expect(result).toEqual(mockUsers);
      expect(mockConnection.query).toHaveBeenCalledWith(
        'UPDATE users SET name = ? WHERE user_id = ?',
        ['Updated Name', 1],
        expect.any(Function)
      );
    });

    it('should throw error when no fields to update', async () => {
      await expect(db.updateUser(1, {})).rejects.toThrow('No fields to update');
    });
  });

  describe('getInviteByKey', () => {
    it('should get invite by key', async () => {
      mockConnection.query.mockImplementation((sql, params, callback) => {
        callback(null, mockInvites, []);
      });
      
      const result = await db.getInviteByKey('test-invite-key');
      expect(result).toEqual(mockInvites);
      expect(mockConnection.query).toHaveBeenCalledWith(
        'SELECT * FROM invites WHERE invite_key = ?',
        ['test-invite-key'],
        expect.any(Function)
      );
    });
  });

  describe('updateInviteUser', () => {
    it('should update invite with user ID', async () => {
      const result = await db.updateInviteUser('test-invite-key', 1);
      expect(result).toEqual(mockUsers);
      expect(mockConnection.query).toHaveBeenCalledWith(
        'UPDATE invites SET user_id = ? WHERE invite_key = ?',
        [1, 'test-invite-key'],
        expect.any(Function)
      );
    });
  });

  describe('close', () => {
    it('should close database connection', async () => {
      await expect(db.close()).resolves.toBeUndefined();
      expect(mockConnection.end).toHaveBeenCalledTimes(1);
    });

    it('should reject on close error', async () => {
      const error = new Error('Close failed');
      mockConnection.end.mockImplementation((callback) => callback(error));
      
      // Ensure we have a connection to close
      db.isConnected = true;
      db.connection = mockConnection;
      
      await expect(db.close()).rejects.toThrow('Close failed');
    });
  });
});
