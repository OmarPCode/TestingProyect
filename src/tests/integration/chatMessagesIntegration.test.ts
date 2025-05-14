process.env.DB_URL = 'mongodb://localhost:27017/dummy';

type Msg = {
  messageId: string;
  fromUserId: string;
  toUserId: string;
  deliveryId: string;
  content: string;
  _id: string;
  createdAt: Date;
  toObject(): Msg;
  save: jest.Mock;
};

const store: Msg[] = [
  {
    messageId: 'msg1',
    fromUserId: 'u1',
    toUserId: 'u2',
    deliveryId: 'd1',
    content: 'Hello world',
    _id: 'msg1',
    createdAt: new Date(),
    toObject() {
      return this;
    },
    save: jest.fn(),
  },
];

const ChatMessageMock: any = jest.fn().mockImplementation((payload: any) => {
  const doc: Msg = {
    ...payload,
    _id: payload.messageId || 'newId',
    createdAt: new Date(),
    toObject() {
      return this;
    },
    save: jest.fn(),
  };

  doc.save.mockResolvedValue(doc);

  return doc;
});

ChatMessageMock.find = jest.fn().mockImplementation(() => Promise.resolve(store));

ChatMessageMock.findOne = jest.fn().mockImplementation(
  ({ messageId }: { messageId: string }) =>
    Promise.resolve(store.find((m) => m.messageId === messageId) || null)
);

jest.mock('../../models/chatMessage.model', () => ChatMessageMock);

jest.mock('../../middlewares', () => ({
  authenticate: (_r: any, _s: any, n: any) => n(),
  authorize: () => (_r: any, _s: any, n: any) => n(),
  validateRequest: (_r: any, _s: any, n: any) => n(),
}));

import express from 'express';
import request from 'supertest';
import chatRouter from '../../routes/chatMessage.route';

// Silence expected console.error during tests
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((msg, ...args) => {
    const isExpected = typeof msg === 'string' && msg.includes('Error creating chat message');
    if (!isExpected) {
      console.warn(msg, ...args);
    }
  });
});

afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});

const app = express();
app.use(express.json());
app.use('/', chatRouter);

describe('ChatMessage routes', () => {
  it('GET / → 200 and returns list', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body[0]).toHaveProperty('messageId', 'msg1');
  });

  it('POST / new → 200 and returns message', async () => {
    const payload = {
      messageId: 'msg2',
      fromUserId: 'u1',
      toUserId: 'u2',
      deliveryId: 'd1',
      content: 'New message',
      createdAt: new Date(),
    };

    const res = await request(app).post('/').send(payload);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('messageId', 'msg2');

    store.push({ ...payload, _id: 'msg2', toObject() { return this; }, save: jest.fn() });
  });

  it('POST / duplicate → 400', async () => {
    const duplicate = {
      messageId: 'msg2',
      fromUserId: 'u1',
      toUserId: 'u2',
      deliveryId: 'd1',
      content: 'Duplicate message',
      createdAt: new Date(),
    };

    const res = await request(app).post('/').send(duplicate);
    expect(res.status).toBe(400);
  });
});
