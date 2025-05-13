import { Before, Given, When, Then, setDefaultTimeout, After } from '@cucumber/cucumber';
import request from 'supertest';
import express, { Application } from 'express';
import bodyParser from 'body-parser';
import sinon from 'sinon';
import nodemailer from 'nodemailer';
import { expect } from 'chai';
import { passwordController } from '../../../controllers/mail.controller';

setDefaultTimeout(60_000);


let app: Application;
let sendMailStub: sinon.SinonStub;
let transportStub: sinon.SinonStub;
let smtpShouldFail = false;
let lastResponse: request.Response;
let to = '';


Before(() => {
  smtpShouldFail = false;

  sendMailStub = sinon.stub().callsFake(() => {
    if (smtpShouldFail) {
      return Promise.reject(new Error('SMTP down'));
    } else {
      return Promise.resolve({ accepted: [to] });
    }
  });


  if (!transportStub || !('restore' in transportStub)) {
    transportStub = sinon.stub(nodemailer, 'createTransport').returns({
      sendMail: sendMailStub
    } as any);
  } else {
    transportStub.returns({
      sendMail: sendMailStub
    } as any);
  }

  app = express();
  app.use(bodyParser.json());
  app.post('/mail', passwordController.sendResetPasswordEmail.bind(passwordController));
});

After(() => {
  if (transportStub?.restore) {
    transportStub.restore();
  }
});


Given(
  'a mail payload with recipient {string}, subject {string} and body {string}',
  function (dest: string, subject: string, body: string) {
    to = dest;
    this.payload = {
      email: dest,
      subject,
      body,
      userId: 'dummy',
    };
  }
);

Given('sending the email will fail with {string}', function (_msg: string) {
  smtpShouldFail = true;
});

When('I send the password reset email', async function () {
  lastResponse = await request(app).post('/mail').send(this.payload);
});

Then('the mail response status should be {int}', function (expectedStatus: number) {
  expect(lastResponse.status).to.equal(expectedStatus);
});
