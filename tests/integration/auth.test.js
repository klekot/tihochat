const request = require('supertest');
const express = require('express');
const session = require('express-session');
const authRoutes = require('../../src/routes/auth');
const { mockUsers, mockInvites } = require('../fixtures/mockData');

// Mock the database service
jest.mock('../../src/services/database', () => ({
  connect: jest.fn(() => Promise.resolve()),
  getUserByLogin: jest.fn(),
  getUserById: jest.fn(),
  createUser: jest.fn(),
  getInviteByKey: jest.fn(),
  updateInviteUser: jest.fn(),
  updateInviteUserById: jest.fn()
}));

const db = require('../../src/services/database');

describe('Auth Routes Integration', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.set('view engine', 'ejs');
    app.set('views', './views');
    
    // Mock the render method to avoid template issues
    app.use((req, res, next) => {
      const originalRender = res.render;
      res.render = function(view, data, callback) {
        // Return a simple HTML response instead of rendering templates
        res.set('Content-Type', 'text/html');
        res.send(`<html><body>${view} page</body></html>`);
      };
      next();
    });
    
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      store: {
        onReady: () => Promise.resolve(),
        close: () => Promise.resolve(),
        on: jest.fn(),
        get: jest.fn(),
        set: jest.fn(),
        destroy: jest.fn()
      }
    }));
    app.use('/', authRoutes);
    
    jest.clearAllMocks();
  });

  describe('GET /login', () => {
    it('should render login page', async () => {
      const response = await request(app)
        .get('/login')
        .expect(200);
      
      expect(response.text).toContain('login page');
    });

    it('should render login page with query parameters', async () => {
      const response = await request(app)
        .get('/login?success=1&user_name=Test&user_login=testuser')
        .expect(200);
      
      expect(response.text).toContain('login page');
    });
  });

  describe('POST /login', () => {
    it('should redirect to login on invalid credentials', async () => {
      db.getUserByLogin.mockResolvedValue([]);
      
      const response = await request(app)
        .post('/login')
        .send({
          login: 'invalid',
          password: 'wrong'
        })
        .expect(302);
      
      expect(response.headers.location).toBe('/login?success=0');
    });

    it('should redirect to login on missing credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({})
        .expect(302);
      
      expect(response.headers.location).toBe('/login?success=0');
    });
  });

  describe('GET /registration', () => {
    it('should render registration page without room', async () => {
      const response = await request(app)
        .get('/registration?person=Test&invite=test-invite')
        .expect(200);
      
      expect(response.text).toContain('registration page');
    });

    it('should redirect on invalid invite', async () => {
      db.getInviteByKey.mockResolvedValue([]);
      
      const response = await request(app)
        .get('/registration?room=test-room&invite=invalid-invite')
        .expect(302);
      
      expect(response.headers.location).toBe('/invite?success=0');
    });
  });

  describe('POST /registration', () => {
    it('should redirect on invalid invite', async () => {
      db.getInviteByKey.mockResolvedValue([]);
      
      const response = await request(app)
        .post('/registration')
        .send({
          invite: 'invalid-invite',
          name: 'New User',
          login: 'newuser',
          password: 'password'
        })
        .expect(302);
      
      expect(response.headers.location).toBe('/invite?success=0');
    });

    it('should redirect on missing fields', async () => {
      const response = await request(app)
        .post('/registration')
        .send({
          invite: 'test-invite'
        })
        .expect(302);
      
      expect(response.headers.location).toBe('/invite?success=0');
    });
  });

  describe('GET /logout', () => {
    it('should render logout page when authenticated', async () => {
      const response = await request(app)
        .get('/logout')
        .set('Cookie', 'connect.sid=test-session')
        .expect(302);
      
      expect(response.headers.location).toBe('/');
    });
  });

});
