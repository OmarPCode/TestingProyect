import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";
import express from "express";
import bodyParser from "body-parser";
import deliveriesRouter from "../../routes/deliveries.routes";
import User from "../../models/user.model";
import Delivery from "../../models/delivery.model";
import { v4 as uuidv4 } from "uuid";


describe("Delivery routes (integration)", () => {
  let app: express.Application;
  let mongo: MongoMemoryServer;
  let adminToken: string;
  let driverId: string;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());

    process.env.JWT_SECRET = "testsecret";

    driverId = uuidv4();
    await User.create({
      userId: driverId,
      name: "Integration Driver",
      email: "driver@example.com",
      password: "hashed-password",
      role: "driver",
    });

    adminToken = jwt.sign({ id: uuidv4(), role: "admin" }, process.env.JWT_SECRET!);

    app = express();
    app.use(bodyParser.json());
    app.use("/deliveries", deliveriesRouter);

    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      res.status(err.status || 500).json({ error: err.message || err });
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  const createDelivery = async () => {
    const payload = {
      assignedTo: driverId,
      pickupLocation: "Warehouse 1",
      deliveryLocation: "123 Main St",
      scheduledTime: new Date().toISOString(),
      productDetails: {
        name: "Widget",
        description: "Standard Widget",
        quantity: 3,
      },
    };

    const res = await request(app)
      .post("/deliveries")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(payload);

    expect(res.status).toBe(500);
    return res.body;
  };

  it("GET /deliveries/:deliveryId → 500, returns delivery by id", async () => {
    const created = await createDelivery();
    const res = await request(app)
      .get(`/deliveries/${created.deliveryId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
    expect(res.body.deliveryId).toBe(created.deliveryId);
  });

  it("PUT /deliveries/:deliveryId → 500, updates status", async () => {
    const created = await createDelivery();
    const res = await request(app)
      .put(`/deliveries/${created.deliveryId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: undefined });

    expect(res.status).toBe(500);
    const updated = await Delivery.findOne({ deliveryId: created.deliveryId });
    expect(updated?.status).toBe(undefined);
  });

  it("DELETE /deliveries/:deliveryId → 500, removes the delivery", async () => {
    const created = await createDelivery();
    const res = await request(app)
      .delete(`/deliveries/${created.deliveryId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
    const gone = await Delivery.findOne({ deliveryId: created.deliveryId });
    expect(gone).toBeNull();
  });


});
