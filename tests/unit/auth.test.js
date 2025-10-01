const { authenticateSession, handleError, validateInput } = require('../../src/middleware/auth');

describe('Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      session: {},
      body: {}
    };
    res = {
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      render: jest.fn(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateSession', () => {
    it('should call next() when user is authenticated', () => {
      req.session.user = { id: 1, name: 'Test User' };
      
      authenticateSession(req, res, next);
      
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.redirect).not.toHaveBeenCalled();
    });

    it('should redirect to home when user is not authenticated', () => {
      req.session.user = null;
      
      authenticateSession(req, res, next);
      
      expect(res.redirect).toHaveBeenCalledWith('/');
      expect(next).not.toHaveBeenCalled();
    });

    it('should redirect to home when session is undefined', () => {
      req.session = undefined;
      
      expect(() => {
        authenticateSession(req, res, next);
      }).toThrow();
    });
  });

  describe('handleError', () => {
    it('should handle error and render 500 page', () => {
      const error = new Error('Test error');
      
      handleError(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.render).toHaveBeenCalledWith('error_pages/500.ejs', {
        message: 'Oops! Something went wrong!',
        error: undefined // In production, error details are hidden
      });
    });

    it('should show error details in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Test error');
      
      handleError(error, req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.render).toHaveBeenCalledWith('error_pages/500.ejs', {
        message: 'Oops! Something went wrong!',
        error: 'Test error'
      });
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('validateInput', () => {
    it('should sanitize string inputs', () => {
      req.body = {
        name: '  Test User  ',
        login: 'testuser',
        password: 'password123',
        description: 'A'.repeat(300) // Long string
      };
      
      validateInput(req, res, next);
      
      expect(req.body.name).toBe('Test User');
      expect(req.body.login).toBe('testuser');
      expect(req.body.password).toBe('password123');
      expect(req.body.description).toBe('A'.repeat(255)); // Truncated to 255 chars
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should handle non-string inputs', () => {
      req.body = {
        id: 123,
        active: true,
        tags: ['tag1', 'tag2']
      };
      
      validateInput(req, res, next);
      
      expect(req.body.id).toBe(123);
      expect(req.body.active).toBe(true);
      expect(req.body.tags).toEqual(['tag1', 'tag2']);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should handle empty body', () => {
      req.body = {};
      
      validateInput(req, res, next);
      
      expect(req.body).toEqual({});
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should handle null/undefined values', () => {
      req.body = {
        name: null,
        login: undefined,
        password: ''
      };
      
      validateInput(req, res, next);
      
      expect(req.body.name).toBe('');
      expect(req.body.login).toBe('');
      expect(req.body.password).toBe('');
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
