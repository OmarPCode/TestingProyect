/**
 * tests/integration/chatMessagesIntegration.test.ts
 * -------------------------------------------------
 * 1) GET /      → 200
 * 2) POST nuevo → 200
 * 3) POST dup   → 400
 */

process.env.DB_URL = 'mongodb://localhost:27017/dummy';

/* ---------- Mock del modelo ChatMessage ---------- */
type Msg = {
  messageId:  string;
  fromUserId: string;
  toUserId:   string;
  deliveryId: string;
  content:    string;
  _id:        string;
  createdAt:  Date;
  toObject(): Msg;
  save: jest.Mock;            // declaramos save en la interfaz
};

const store: Msg[] = [
  {
    messageId: 'msg1',
    fromUserId: 'u1',
    toUserId:   'u2',
    deliveryId: 'd1',
    content:    'Hola mundo',
    _id:        'msg1',
    createdAt:  new Date(),
    toObject() { return this; },
    save: jest.fn(),          // no se usa para el mensaje precargado
  },
];

const ChatMessageMock: any = jest.fn().mockImplementation((payload: any) => {
  const doc: Msg = {
    ...payload,
    _id: payload.messageId || 'newId',
    createdAt: new Date(),
    toObject() { return this; },
    save: jest.fn(),          // se define justo aquí
  };

  // save() resuelve con el propio documento
  doc.save.mockResolvedValue(doc);

  return doc;
});

// métodos estáticos
ChatMessageMock.find = jest.fn().mockImplementation(() => Promise.resolve(store));

ChatMessageMock.findOne = jest.fn().mockImplementation(
  ({ messageId }: { messageId: string }) =>
    Promise.resolve(store.find((m) => m.messageId === messageId) || null)
);

jest.mock('../../models/chatMessage.model', () => ChatMessageMock);

/* ---------- Mock de middlewares ---------- */
jest.mock('../../middlewares', () => ({
  authenticate: (_r: any, _s: any, n: any) => n(),
  authorize: () => (_r: any, _s: any, n: any) => n(),
  validateRequest: (_r: any, _s: any, n: any) => n(),
}));

/* ---------- Imports después de mocks ---------- */
import express from 'express';
import request from 'supertest';
import chatRouter from '../../routes/chatMessage.route';

/* Mini‑app con solo las rutas de chat */
const app = express();
app.use(express.json());
app.use('/', chatRouter);

/* ---------- Tests ---------- */
describe('ChatMessage routes', () => {
  it('GET / → 200 y lista', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body[0]).toHaveProperty('messageId', 'msg1');
  });

  it('POST / nuevo → 200 y devuelve mensaje', async () => {
    const payload = {
      messageId:  'msg2',
      fromUserId: 'u1',
      toUserId:   'u2',
      deliveryId: 'd1',
      content:    'Nuevo mensaje',
      createdAt:  new Date(),
    };

    const res = await request(app).post('/').send(payload);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('messageId', 'msg2');

    // agrega al store para que el siguiente POST sea duplicado
    store.push({ ...payload, _id: 'msg2', toObject() { return this; }, save: jest.fn() });
  });

  it('POST / duplicado → 400', async () => {
    const duplicate = {
      messageId:  'msg2', // ya existe
      fromUserId: 'u1',
      toUserId:   'u2',
      deliveryId: 'd1',
      content:    'Mensaje duplicado',
      createdAt:  new Date(),
    };

    const res = await request(app).post('/').send(duplicate);
    expect(res.status).toBe(400);
  });
});
