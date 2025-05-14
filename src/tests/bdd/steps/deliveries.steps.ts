import { Given, When, Then, BeforeAll, AfterAll, setDefaultTimeout } from "@cucumber/cucumber";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import express from "express";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import { expect } from "chai";
import User from "../../../models/user.model";
import Delivery from "../../../models/delivery.model";
import { v4 as uuidv4 } from "uuid";

setDefaultTimeout(60_000);

let app: express.Application;
let mongo: MongoMemoryServer;
let adminToken: string;
let driverId: string;
let lastResponse: request.Response;
let lastDeliveryId: string;

const authHeader = (req: request.Test) =>
  req.set("authorization", `Bearer ${adminToken}`);
const validPayload = () => ({
  assignedTo: "ecaf0b79-c588-4630-9a4e-81e32adb9114",
  pickupLocation: "Warehouse A",
  deliveryLocation: "123 Main St",
  scheduledTime: "2025-12-31T00:00:00.000Z",
  productDetails: {
    name: "Test Product", 
    description: "Automated test", 
    quantity: 2, 
    productId: "344b418f-a42b-436b-98f4-564f9cec0fe5",
  },
});

BeforeAll(async () => {
  process.env.JWT_SECRET = "testsecret";

  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  const { default: deliveriesRouter } = await import("../../../routes/deliveries.routes");

  app = express();
  app.use(bodyParser.json());
  app.use("/deliveries", deliveriesRouter);

    driverId = "ecaf0b79-c588-4630-9a4e-81e32adb9114";
  await User.create({
    userId: driverId,
    name: "Prueba Driver",
    email: "v.t.a.e.v15@gmail.com",
    password: "hashed",
    role: "driver",
    status: "new",
    profilePic: "",
  });

 
    const delivery = await new Delivery({
    deliveryId: "7803e9c6-affc-4de6-83ae-d6354cef57d6",
    assignedTo: driverId,
    status: "in-progress",
    route: "none",
    productDetails: {
      productId: "344b418f-a42b-436b-98f4-564f9cec0fe5",
      name: "Test Product",
      description: "Automated test",
      quantity: 2,
    },
    pickupLocation: "Warehouse A",
    deliveryLocation: "123 Main St",
    scheduledTime: "2025-12-31T00:00:00.000Z",
    createdAt: new Date(),
    updatedAt: new Date(),
    deliveredAt: null,
  }).save();

  lastDeliveryId = delivery.deliveryId;

  adminToken = jwt.sign({ id: uuidv4(), role: "admin" }, process.env.JWT_SECRET!);
});

AfterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

Given("an authenticated admin token", function () {});
Given("a driver exists", function () {});

When(/^I POST \/deliveries with a valid payload$/, async function () {
  lastResponse = await authHeader(request(app).post("/deliveries")).send(validPayload());
  if (lastResponse.body.deliveryId) lastDeliveryId = lastResponse.body.deliveryId;
});

When(/^I GET \/deliveries$/, async function () {
  lastResponse = await authHeader(request(app).get("/deliveries"));
});

When(/^I GET \/deliveries\/\{deliveryId\}$/, async function () {
  lastResponse = await authHeader(request(app).get(`/deliveries/${lastDeliveryId}`));
});

When(/^I PUT \/deliveries\/\{deliveryId\} with (.*)$/, async function (json: string) {
  lastResponse = await authHeader(request(app).put(`/deliveries/${lastDeliveryId}`)).send(JSON.parse(json));
});

When(/^I DELETE \/deliveries\/\{deliveryId\}$/, async function () {
  lastResponse = await authHeader(request(app).delete(`/deliveries/${lastDeliveryId}`));
});

Then(/^the response status should be (\d+)$/, function (code: string) {
  expect(lastResponse.status).to.equal(parseInt(code, 10));
});

Then(/^the body should contain a deliveryId$/, function () {
  expect(lastResponse.body).to.have.property("deliveryId");
});

Then(/^the body\.deliveryId should equal \{deliveryId\}$/, function () {
  expect(lastResponse.body.deliveryId).to.equal(lastDeliveryId);
});

Then(/^the body\.status should equal "([^"]+)"$/, function (status: string) {
  expect(lastResponse.body.status).to.equal(status);
});

Then(/^the delivery should no longer exist in the database$/, async function () {
  const gone = await Delivery.findOne({ deliveryId: lastDeliveryId });
  expect(gone).to.be.null;
});


Given("a delivery already exists", async function () {
  const delivery = await new Delivery({
    ...validPayload(),
    deliveryId: uuidv4(),
    status: "in-progress",
    route: "none",
    createdAt: new Date(),
    updatedAt: new Date(),
  }).save();

  lastDeliveryId = delivery.deliveryId;
});