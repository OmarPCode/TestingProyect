import { Given, When, Then, BeforeAll, AfterAll } from "@cucumber/cucumber";
import request from "supertest";
import mongoose from "mongoose";
import express from "express";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import Delivery from "../../../models/delivery.model";
import User from "../../../models/user.model";
import { setLastResponse } from "./support/responseHolder";

let app: express.Application;
let token: string;
let driverId: string;
let deliveryId: string;

const auth = (req: request.Test) => req.set("authorization", `Bearer ${token}`);

const validDeliveryPayload = () => ({
  assignedTo: driverId,
  pickupLocation: "Warehouse X",
  deliveryLocation: "123 Some St",
  scheduledTime: new Date().toISOString(),
  productDetails: {
    name: "Item",
    description: "Desc",
    quantity: 2,
    productId: uuidv4(),
  },
});

BeforeAll(async () => {
  process.env.JWT_SECRET = "test";

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect("mongodb://127.0.0.1:27017/test-deliveries");
  }

  const { default: router } = await import("../../../routes/deliveries.routes");
  app = express();
  app.use(bodyParser.json());
  app.use("/deliveries", router);

  token = jwt.sign({ id: uuidv4(), role: "admin" }, process.env.JWT_SECRET!);

  driverId = uuidv4();
  await User.create({
    userId: driverId,
    name: "BDD Driver",
    email: "bdd_driver@example.com",
    password: "hashed",
    role: "driver",
  });
});

AfterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

Given(/^a driver exists$/, function () {});
Given(/^a delivery already exists$/, async function () {
  const delivery = await new Delivery({
    ...validDeliveryPayload(),
    deliveryId: uuidv4(),
    status: "in-progress",
    route: "R1",
    createdAt: new Date(),
    updatedAt: new Date(),
  }).save();
  deliveryId = delivery.deliveryId;
});

When(/^I POST \/deliveries with a valid payload$/, async function () {
  const res = await auth(request(app).post("/deliveries")).send(validDeliveryPayload());
  deliveryId = res.body.deliveryId;
  setLastResponse(res);
});

When(/^I GET \/deliveries$/, async function () {
  const res = await auth(request(app).get("/deliveries"));
  setLastResponse(res);
});

When(/^I GET \/deliveries\/{deliveryId}$/, async function () {
  const res = await auth(request(app).get(`/deliveries/${deliveryId}`));
  setLastResponse(res);
});

When(/^I PUT \/deliveries\/{deliveryId} with (.+)$/, async function (json: string) {
  const res = await auth(request(app).put(`/deliveries/${deliveryId}`)).send(JSON.parse(json));
  setLastResponse(res);
});

When(/^I DELETE \/deliveries\/{deliveryId}$/, async function () {
  const res = await auth(request(app).delete(`/deliveries/${deliveryId}`));
  setLastResponse(res);
});

When(/^I GET \/deliveries\/byDriver\?driverId=\{driverId\}$/, async function () {
  const res = await auth(request(app).get("/deliveries/byDriver").query({ driverId }));
  setLastResponse(res);
});
