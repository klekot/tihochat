const { Server } = require('socket.io');
const http = require('http');
const setupSocketIO = require('../../src/services/socketService');
const { mockUsers } = require('../fixtures/mockData');

// Mock the database service
jest.mock('../../src/services/database', () => ({
  connect: jest.fn(() => Promise.resolve()),
  getUserById: jest.fn()
}));

const db = require('../../src/services/database');

describe('Socket.IO Service', () => {
  let server, io;

  beforeEach(() => {
    server = http.createServer();
    io = new Server(server);
    
    setupSocketIO(io);
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (server) {
      server.close();
    }
  });

  describe('socket service setup', () => {
    it('should setup socket.io service without errors', () => {
      expect(() => {
        setupSocketIO(io);
      }).not.toThrow();
    });

    it('should handle connection events', () => {
      const mockSocket = {
        join: jest.fn(),
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
        on: jest.fn()
      };

      // Simulate the connection event by calling the handler directly
      const connectionHandler = io.listeners('connection')[0];
      if (connectionHandler) {
        connectionHandler(mockSocket);
      }
      
      // Verify that event listeners were set up
      expect(mockSocket.on).toHaveBeenCalledWith('join-room', expect.any(Function));
    });
  });
});
