const fs = require('fs');
const path = require('path');
const { handleFileUpload, generateAvatarUrl, createSessionUser } = require('../../src/utils/fileUtils');

describe('File Utils', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      file: null,
      session: {
        user: { id: 1 }
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleFileUpload', () => {
    it('should call next() when no file is uploaded', () => {
      handleFileUpload(req, res, next);
      
      expect(next).toHaveBeenCalledTimes(1);
      expect(fs.existsSync).not.toHaveBeenCalled();
    });

    it('should handle valid image file upload', () => {
      req.file = {
        originalname: 'avatar.jpg',
        path: '/tmp/temp-file'
      };

      // Mock fs.rename to call the callback immediately
      fs.rename.mockImplementation((src, dest, callback) => {
        callback(null); // Success
      });

      handleFileUpload(req, res, next);
      
      expect(fs.existsSync).toHaveBeenCalledWith('./uploads/1');
      expect(fs.mkdirSync).toHaveBeenCalledWith('./uploads/1', { recursive: true });
      expect(fs.rename).toHaveBeenCalled();
      expect(req.uploadedAvatar).toBe('avatar.jpg');
    });

    it('should reject invalid file extension', () => {
      req.file = {
        originalname: 'document.pdf',
        path: '/tmp/temp-file'
      };

      handleFileUpload(req, res, next);
      
      expect(fs.unlink).toHaveBeenCalledWith('/tmp/temp-file', expect.any(Function));
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Only .png, .jpg, .jpeg files are allowed!' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle file rename error', () => {
      req.file = {
        originalname: 'avatar.jpg',
        path: '/tmp/temp-file'
      };

      const error = new Error('Rename failed');
      fs.rename.mockImplementation((src, dest, callback) => callback(error));

      handleFileUpload(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'File upload failed' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle case insensitive file extensions', () => {
      req.file = {
        originalname: 'AVATAR.PNG',
        path: '/tmp/temp-file'
      };

      // Mock fs.rename to call the callback immediately
      fs.rename.mockImplementation((src, dest, callback) => {
        callback(null); // Success
      });

      handleFileUpload(req, res, next);
      
      expect(fs.rename).toHaveBeenCalled();
      expect(req.uploadedAvatar).toBe('AVATAR.PNG');
    });
  });

  describe('generateAvatarUrl', () => {
    it('should generate URL with avatar', () => {
      const url = generateAvatarUrl(1, 'avatar.jpg');
      expect(url).toBe('/1/avatar.jpg');
    });

    it('should return default avatar when no avatar', () => {
      const url = generateAvatarUrl(1, null);
      expect(url).toBe('/default_avatar.jpg');
    });

    it('should return default avatar when empty avatar', () => {
      const url = generateAvatarUrl(1, '');
      expect(url).toBe('/default_avatar.jpg');
    });
  });

  describe('createSessionUser', () => {
    it('should create session user object', () => {
      const userData = {
        user_id: 1,
        login: 'testuser',
        name: 'Test User',
        avatar: 'avatar.jpg',
        password: 'hashed_password' // Should be excluded
      };

      const sessionUser = createSessionUser(userData);
      
      expect(sessionUser).toEqual({
        id: 1,
        login: 'testuser',
        name: 'Test User',
        avatar: 'avatar.jpg'
      });
      expect(sessionUser.password).toBeUndefined();
    });

    it('should handle user data with null avatar', () => {
      const userData = {
        user_id: 2,
        login: 'testuser2',
        name: 'Test User 2',
        avatar: null
      };

      const sessionUser = createSessionUser(userData);
      
      expect(sessionUser).toEqual({
        id: 2,
        login: 'testuser2',
        name: 'Test User 2',
        avatar: null
      });
    });
  });
});
