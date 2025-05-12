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

/****  GLOBALS ****/
let app: express.Application;
let mongo: MongoMemoryServer;
let adminToken: string;
let driverId: string;
let lastResponse: request.Response;
let lastDeliveryId: string;

/****  HELPERS ****/
const authHeader = (req: request.Test) =>
  req.set("authorization", `Bearer ${adminToken}`); // use lowercase header so req.headers["authorization"] works

const validPayload = () => ({
  assignedTo: driverId,
  pickupLocation: "Warehouse B",
  deliveryLocation: "456 Elm St",
  scheduledTime: new Date().toISOString(),
  productDetails: {
    name: "Widget",
    description: "Std",
    quantity: 1,
    productId: uuidv4(),
  },
});

/****  HOOKS ****/
BeforeAll(async () => {
  // set secret *before* the router/middleware is imported
  process.env.JWT_SECRET = "testsecret";

  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  // create minimal express app lazily after we have secret
  const { default: deliveriesRouter } = await import("../../../routes/deliveries.routes");

  app = express();
  app.use(bodyParser.json());
  app.use("/deliveries", deliveriesRouter);

  // seed driver
  driverId = uuidv4();
  await User.create({
    userId: driverId,
    name: "BDD Driver",
    email: "bdd_driver@example.com",
    password: "hashed",
    role: "driver",
  });

  // build token compatible with authenticate middleware (expects id + role)
  adminToken = jwt.sign({ id: uuidv4(), role: "admin" }, process.env.JWT_SECRET!);
});

AfterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

/****  STEP DEFINITIONS ****/
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

When(/^I GET \/deliveries\/byDriver\?driverId=\{driverId\}$/, async function () {
  lastResponse = await authHeader(request(app).get("/deliveries/byDriver")).query({ driverId });
});

/****  ASSERTIONS ****/
Then(/^the response status should be (\d+)$/, function (code: string) {
  expect(lastResponse.status).to.equal(parseInt(code, 10));
});

Then(/^the body should contain a deliveryId$/, function () {
  expect(lastResponse.body).to.have.property("deliveryId");
});

Then(/^the body should contain a non‑empty deliveries array$/, function () {
  expect(lastResponse.body.deliveries).to.be.an("array").that.is.not.empty;
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

Then(/^every returned delivery should belong to \{driverId\}$/, function () {
  const list = lastResponse.body.delivery;
  expect(list.every((d: any) => d.assignedTo === driverId)).to.be.true;
});

/****  UTIL SEED ****/
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
