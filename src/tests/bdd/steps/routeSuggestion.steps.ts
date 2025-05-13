import { Given, When, Then, BeforeAll, AfterAll, setDefaultTimeout } from "@cucumber/cucumber";
import request from "supertest";
import mongoose from "mongoose";
import express from "express";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import { expect } from "chai";
import { v4 as uuidv4 } from "uuid";
import RouteSuggestion from "../../../models/routeSuggestion.model";
import { setLastResponse } from "./support/responseHolder";

setDefaultTimeout(60_000);

let app: express.Application;
let token: string;
let lastId: string;

const auth = (req: request.Test) => req.set("authorization", `Bearer ${token}`);

const validPayload = () => ({
  routeSuggestionId: uuidv4(),
  deliveryId: uuidv4(),
  suggestedRoute: "Route 1",
  estimatedTime: 45,
  createdAt: new Date(),
});

BeforeAll(async () => {
  process.env.JWT_SECRET = "test";
  process.env.GRASS = "mocked_key";

  await mongoose.connect("mongodb://127.0.0.1:27017/testroutes");

  const { default: router } = await import("../../../routes/routeSuggestion.route");
  app = express();
  app.use(bodyParser.json());
  app.use("/routeSuggestions", router);

  token = jwt.sign({ id: uuidv4(), role: "admin" }, process.env.JWT_SECRET!);
});

AfterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

Given(/^a route suggestion already exists$/, async function () {
  const suggestion = await new RouteSuggestion(validPayload()).save();
  lastId = suggestion.routeSuggestionId;
});

When(/^I POST \/routeSuggestions with a valid payload$/, async function () {
  const payload = validPayload();
  lastId = payload.routeSuggestionId;
  const res = await auth(request(app).post("/routeSuggestions")).send(payload);
  setLastResponse(res);
});

When(/^I POST \/routeSuggestions with the same payload$/, async function () {
  const existing = await RouteSuggestion.findOne();
  const res = await auth(request(app).post("/routeSuggestions")).send(existing?.toObject());
  setLastResponse(res);
});

When(/^I POST \/routeSuggestions with an invalid payload$/, async function () {
  const res = await auth(request(app).post("/routeSuggestions")).send({ suggestedRoute: "Only this" });
  setLastResponse(res);
});

When(/^I GET \/routeSuggestions$/, async function () {
  const res = await auth(request(app).get("/routeSuggestions"));
  setLastResponse(res);
});

When(/^I GET \/routeSuggestions\/{routeSuggestionId}$/, async function () {
  const res = await auth(request(app).get(`/routeSuggestions/${lastId}`));
  setLastResponse(res);
});

When(/^I GET \/routeSuggestions\/{nonexistentId}$/, async function () {
  const res = await auth(request(app).get(`/routeSuggestions/nonexistent-id`));
  setLastResponse(res);
});

When(/^I PUT \/routeSuggestions\/{routeSuggestionId} with (.+)$/, async function (json: string) {
  const res = await auth(request(app).put(`/routeSuggestions/${lastId}`)).send(JSON.parse(json));
  setLastResponse(res);
});

When(/^I PUT \/routeSuggestions\/{nonexistentId} with (.+)$/, async function (json: string) {
  const res = await auth(request(app).put(`/routeSuggestions/fake-id`)).send(JSON.parse(json));
  setLastResponse(res);
});

When(/^I DELETE \/routeSuggestions\/{routeSuggestionId}$/, async function () {
  const res = await auth(request(app).delete(`/routeSuggestions/${lastId}`));
  setLastResponse(res);
});

When(/^I DELETE \/routeSuggestions\/{nonexistentId}$/, async function () {
  const res = await auth(request(app).delete(`/routeSuggestions/fake-id`));
  setLastResponse(res);
});

When(/^I POST \/routeSuggestions\/fromMap with valid start and end$/, async function () {
  const res = await auth(request(app).post("/routeSuggestions/fromMap")).send({
    start: [20.6, -103.4],
    end: [20.7, -103.3],
  });
  setLastResponse(res);
});

When(/^I POST \/routeSuggestions\/fromMap with missing points$/, async function () {
  const res = await auth(request(app).post("/routeSuggestions/fromMap")).send({});
  setLastResponse(res);
});

Then(/^the body should contain a routeSuggestionId$/, function () {
  const res = require("./support/responseHolder").getLastResponse();
  expect(res.body).to.have.property("routeSuggestionId");
});

Then(/^the body should contain a non-empty array$/, function () {
  const res = require("./support/responseHolder").getLastResponse();
  expect(res.body).to.be.an("array").that.is.not.empty;
});

Then(/^the body\.routeSuggestionId should equal \{routeSuggestionId\}$/, function () {
  const res = require("./support/responseHolder").getLastResponse();
  expect(res.body.routeSuggestionId).to.equal(lastId);
});

Then(/^the body\.estimatedTime should equal (\d+)$/, function (val: number) {
  const res = require("./support/responseHolder").getLastResponse();
  expect(res.body.estimatedTime).to.equal(val);
});

Then(/^the route suggestion should no longer exist in the database$/, async function () {
  const gone = await RouteSuggestion.findOne({ routeSuggestionId: lastId });
  expect(gone).to.be.null;
});
