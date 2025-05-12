import { Given, When, Then } from '@cucumber/cucumber';
import request from 'supertest';
import app from '../../server.mock';
let chai: typeof import('chai');
(async () => {
  chai = await import('chai');
})();
const { expect } = chai;


let response: request.Response;

Given('the database contains deliveries', async () => {
  // Mock the database to contain deliveries
  jest.mock('../../../models/delivery.model', () => ({
    find: jest.fn().mockResolvedValue([
      {
        deliveryId: 'd123',
        assignedTo: '123',
        pickupLocation: 'Location A',
        deliveryLocation: 'Location B',
        status: 'in-progress',
        scheduledTime: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]),
  }));
});

When('I send a GET request to {string}', async (endpoint: string) => {
  response = await request(app).get(endpoint);
});

Then('I should receive a {int} status code', (statusCode: number) => {
  expect(response.status).to.equal(statusCode);
});

Then('the response should contain a list of deliveries', () => {
  expect(response.body).to.be.an('array');
  expect(response.body[0]).to.have.property('deliveryId', 'd123');
});

Given('I have valid delivery data', () => {
  // Mock valid delivery data
  jest.mock('../../../models/delivery.model', () => ({
    create: jest.fn().mockResolvedValue({
      deliveryId: 'd124',
      assignedTo: '123',
      pickupLocation: 'Location C',
      deliveryLocation: 'Location D',
      status: 'pending',
      scheduledTime: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  }));
});

When('I send a POST request to {string} with the data', async (endpoint: string) => {
  const newDelivery = {
    assignedTo: '123',
    pickupLocation: 'Location C',
    deliveryLocation: 'Location D',
    scheduledTime: new Date().toISOString(),
    productDetails: { name: 'Product A', quantity: 1 },
  };
  response = await request(app).post(endpoint).send(newDelivery);
});

Then('the response should contain the created delivery', () => {
  expect(response.body).to.have.property('deliveryId', 'd124');
  expect(response.body).to.have.property('pickupLocation', 'Location C');
});

Given('a delivery exists with ID {string}', (deliveryId: string) => {
  jest.mock('../../../models/delivery.model', () => ({
    findOne: jest.fn().mockResolvedValue({
      deliveryId,
      assignedTo: '123',
      pickupLocation: 'Location A',
      deliveryLocation: 'Location B',
      status: 'in-progress',
      scheduledTime: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  }));
});

When('I send a GET request to {string}', async (endpoint: string) => {
  response = await request(app).get(endpoint);
});

Then('the response should contain the delivery details', () => {
  expect(response.body).to.have.property('deliveryId', 'd123');
  expect(response.body).to.have.property('pickupLocation', 'Location A');
});