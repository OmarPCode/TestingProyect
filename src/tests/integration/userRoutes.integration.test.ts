import request from 'supertest';
import app from '../server.mock';
import { Request, Response, NextFunction } from 'express';

// Mock the authentication and validation middleware to bypass them in integration tests
jest.mock('../../middlewares', () => ({
  authenticate: (req: Request, res: Response, next: NextFunction) => next(),
  authorize: (roles: string[]) => (req: Request, res: Response, next: NextFunction) => next(),
  validateRequest: (req: Request, res: Response, next: NextFunction) => next(),
}));

// Mock the User model to avoid real database calls
jest.mock('../../models/user.model', () => ({
  find: jest.fn().mockResolvedValue([
    {
      userId: '123',
      name: 'Alice',
      email: 'alice@example.com',
      role: 'admin',
      status: 'active',
      profilePic: '',
      createdAt: new Date(),
      toObject() { return this; },
    },
  ]),
  findOne: jest.fn().mockImplementation(({ userId }: { userId: string }) => {
    if (userId === '123') {
      return Promise.resolve({
        userId: '123',
        name: 'Alice',
        email: 'alice@example.com',
        role: 'admin',
        status: 'active',
        profilePic: '',
        createdAt: new Date(),
        toObject() { return this; },
      });
    }
    return Promise.resolve(null);
  }),
}));

describe('Integration tests for User routes', () => {
  describe('GET /user', () => {
    it('should return 200 and an array of users', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty('userId', '123');
    });
  });

  describe('GET /user/drivers', () => {
    it('should return 200 and an array of drivers', async () => {
      const res = await request(app).get('/drivers');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /user/:userId', () => {
    it('should return 200 and the user when it exists', async () => {
      const res = await request(app).get('/123');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('userId', '123');
      expect(res.body).toHaveProperty('email', 'alice@example.com');
    });

    it('should return 404 when the user does not exist', async () => {
      const User = require('../../models/user.model');
      User.findOne.mockResolvedValue(null);

      const res = await request(app).get('/unknown');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
    });
  });
});
