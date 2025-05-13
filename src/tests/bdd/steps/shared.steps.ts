import { Given, Then } from "@cucumber/cucumber";
import { expect } from "chai";
import { getLastResponse } from "./support/responseHolder";

Given(/^an authenticated admin token$/, function () {
  // no-op, el token lo debes configurar en cada suite con su BeforeAll
});

Then(/^the response status should be (\d+)$/, function (statusCode: number) {
  const res = getLastResponse();
  expect(res.status).to.equal(statusCode);
});
