import { Given, When, Then, BeforeAll, AfterAll, setDefaultTimeout, DataTable } from '@cucumber/cucumber';
import request, { Response } from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import { expect } from 'chai';
import { v4 as uuidv4 } from 'uuid';
import User from '../../../models/user.model';

interface Payload { [key: string]: any; }
setDefaultTimeout(60_000);

let app: express.Application;
let mongoServer: MongoMemoryServer;
let adminToken: string;
let testUserId: string;
let lastResponse: Response;

BeforeAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  process.env.JWT_SECRET = 'testsecret';
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  const { default: userRouter } = await import('../../../routes/user.route');
  app = express();
  app.use(bodyParser.json());
  app.use('/user', userRouter);

  const adminId = uuidv4();
  await User.create({
    userId: adminId,
    name: 'Admin',
    email: 'admin@example.com',
    password: 'hashedpass',
    role: 'admin',
  });
  adminToken = jwt.sign({ id: adminId, role: 'admin' }, process.env.JWT_SECRET!);
});

AfterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

Given('la aplicación está corriendo en {string}', function (_url: string) {
});

Given('existe un usuario admin con email {string} y password {string}', function (_e: string, _p: string) {
});

Given('estoy autenticado como admin', function () {
  expect(adminToken).to.be.a('string').and.to.have.length.greaterThan(0);
});

When(/^hago POST \/user\/register con el siguiente payload:$/, async function (dataTable: DataTable) {
  const payload: Payload = {};
  dataTable.hashes().forEach(row => {
    payload[row['campo']] = row['valor'];
  });
  lastResponse = await request(app)
    .post('/user/register')
    .send(payload)
    .set('Authorization', `Bearer ${adminToken}`)
    .set('Accept', 'application/json');
  const created = await User.findOne({ email: payload.email });
  testUserId = created!.userId;
});

Then('el status de la respuesta debe ser {int}', function (expected: number) {
  expect(lastResponse.status).to.equal(expected);
});

Then('el body debe contener un {string}', function (field: string) {
  expect(lastResponse.body).to.have.property(field);
});

Given('existe un usuario con email {string} y password {string} y role {string}',
  async function (email: string, password: string, role: string) {
    let user = await User.findOne({ email });
    if (!user) {
      await request(app)
        .post('/user/register')
        .send({ name: 'Temp', email, password, role })
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Accept', 'application/json');
      user = await User.findOne({ email });
    }
    expect(user).to.not.be.null;
    testUserId = user!.userId;
  }
);

When(/^hago POST \/user\/login con:$/, async function (dataTable: DataTable) {
  const creds: Payload = {};
  dataTable.hashes().forEach(row => {
    creds[row['campo']] = row['valor'];
  });
  lastResponse = await request(app)
    .post('/user/login')
    .send(creds)
    .set('Accept', 'application/json');
});

Given('existe un usuario y tengo su {string}', function (key: string) {
  expect(key).to.equal('userId');
  expect(testUserId).to.be.a('string').and.to.have.length.greaterThan(0);
});

When(/^hago GET \/user\/{userId}$/, async function () {
  lastResponse = await request(app)
    .get(`/user/${testUserId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .set('Accept', 'application/json');
});

When(/^hago PUT \/user\/{userId} con:$/, async function (dataTable: DataTable) {
  const update: Payload = {};
  dataTable.hashes().forEach(row => { update[row['campo']] = row['valor']; });
  lastResponse = await request(app)
    .put(`/user/${testUserId}`)
    .send(update)
    .set('Authorization', `Bearer ${adminToken}`)
    .set('Accept', 'application/json');
});

When(/^hago DELETE \/user\/{userId}$/, async function () {
  lastResponse = await request(app)
    .delete(`/user/${testUserId}`)
    .set('Authorization', `Bearer ${adminToken}`);
});

Then(/^body\.userId debe ser \{userId\}$/, function () {
  expect(lastResponse.body.userId).to.equal(testUserId);
});

Then('body.name debe ser {string}', function (expectedName: string) {
  expect(lastResponse.body.name).to.equal(expectedName);
});

Then('el usuario ya no debe existir', async function () {
  const res = await request(app)
    .get(`/user/${testUserId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .set('Accept', 'application/json');
  expect(res.status).to.equal(404);
});