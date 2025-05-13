import Delivery from "../../models/delivery.model";


jest.mock("../../models/delivery.model", () => {
  const M: any = jest.fn();
  ["find", "findOne", "deleteOne", "findOneAndUpdate"].forEach((m) => (M[m] = jest.fn()));
  return M;
});

jest.mock("../../controllers/user.controller", () => ({
  userControllers: {
    getId: jest.fn()
  }
}));

import { deliveryControllers } from "../../controllers";
import { userControllers } from "../../controllers/user.controller";
import { HTTP_STATUS } from "../../types/http-status-codes";
import { v4 as uuidv4 } from "uuid";

const mockRes = () => 
  ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    send: jest.fn(),
  }) as any;

describe("Delivery Controller", () => {
  const originalConsoleError = console.error;
  
  beforeAll(() => {
    console.error = jest.fn();
  });
  
  afterAll(() => {
    console.error = originalConsoleError;
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("creates a delivery successfully", async () => {
      const body = {
        assignedTo: "driver1",
        pickupLocation: "A",
        deliveryLocation: "B",
        scheduledTime: new Date().toISOString(),
      };
      
      const saved = { ...body, deliveryId: uuidv4() };
      (Delivery as unknown as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockResolvedValueOnce(saved),
      }));
      
      const res = mockRes();
      await deliveryControllers.create({ body } as any, res);
      
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalledWith(saved);
    });
    
    it("returns 400 when save() fails", async () => {
      (Delivery as unknown as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockRejectedValueOnce(new Error("insert error")),
      }));
      
      const res = mockRes();
      await deliveryControllers.create({ body: {} } as any, res);
      
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Error creating delivery" }),
      );
      expect(console.error).toHaveBeenCalledWith(
        "Error creating delivery:", 
        expect.any(Error)
      );
    });
  });
  
  describe("getAll", () => {
    const makeQueryMock = (result: any) => ({
      sort: jest.fn().mockReturnValue(result),
    });
    
    it("returns all deliveries (200)", async () => {
      const list = [
        { deliveryId: "1", status: "in‑progress", assignedTo: "u1" },
        { deliveryId: "2", status: "completed",   assignedTo: "u2" },
      ];
      (Delivery.find as jest.Mock).mockReturnValue(makeQueryMock(list));
      
      (userControllers.getId as jest.Mock)
        .mockResolvedValueOnce({ userId: "u1" })
        .mockResolvedValueOnce({ userId: "u2" });
      
      const res = mockRes();
      await deliveryControllers.getAll({} as any, res);
      
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalledWith({
        deliveries: list,
        users: [{ userId: "u1" }, { userId: "u2" }],
      });
    });
    
    it("returns 200 with empty list", async () => {
      (Delivery.find as jest.Mock).mockReturnValue(makeQueryMock([]));
      
      const res = mockRes();
      await deliveryControllers.getAll({} as any, res);
      
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalledWith({
        deliveries: [],
        users: [],
      });
    });
  });

  describe("getById", () => {
    it("returns a delivery by ID", async () => {
      const delivery = {
        deliveryId: "123",
        assignedTo: "driver1",
        pickupLocation: "A",
        deliveryLocation: "B",
        status: "in-progress",
        toObject: jest.fn().mockReturnThis()
      };

      (Delivery.findOne as jest.Mock).mockResolvedValue(delivery);
      
      const res = mockRes();
      await deliveryControllers.getById({ params: { deliveryId: "123" } } as any, res);
      
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalled();
    });
    
    it("returns 404 when delivery not found", async () => {
      (Delivery.findOne as jest.Mock).mockResolvedValue(null);
      
      const res = mockRes();
      await deliveryControllers.getById({ params: { deliveryId: "not-found" } } as any, res);
      
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Error fetching delivery" })
      );
      expect(console.error).toHaveBeenCalledWith(
        "Error fetching delivery by ID:", 
        expect.any(Error)
      );
    });
  });

  describe("update", () => {
    it("updates a delivery successfully", async () => {
      const existingDelivery = {
        deliveryId: "123",
        status: "in-progress",
        productDetails: { productId: "prod1" },
        toObject: jest.fn().mockReturnThis()
      };
      
      const updatedDelivery = {
        ...existingDelivery,
        status: "completed"
      };
      
      (Delivery.findOne as jest.Mock).mockResolvedValue(existingDelivery);
      (Delivery.findOneAndUpdate as jest.Mock).mockResolvedValue(updatedDelivery);
      
      const res = mockRes();
      await deliveryControllers.update({ 
        params: { deliveryId: "123" },
        body: { status: "completed" }
      } as any, res);
      
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalledWith(updatedDelivery);
    });
    
    it("returns 400 when delivery not found", async () => {
      (Delivery.findOne as jest.Mock).mockResolvedValue(null);
      
      const res = mockRes();
      await deliveryControllers.update({
        params: { deliveryId: "not-found" },
        body: { status: "completed" }
      } as any, res);
      
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Error updating delivery" })
      );
      expect(console.error).toHaveBeenCalledWith(
        "Error updating delivery:", 
        expect.any(Error)
      );
    });
  });

  describe("delete", () => {
    it("deletes a delivery successfully", async () => {
      const delivery = { deliveryId: "123" };
      const deleteResult = { deletedCount: 1 };
      
      (Delivery.findOne as jest.Mock).mockResolvedValue(delivery);
      (Delivery.deleteOne as jest.Mock).mockResolvedValue(deleteResult);
      
      const res = mockRes();
      await deliveryControllers.delete({ params: { deliveryId: "123" } } as any, res);
      
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalledWith(deleteResult);
    });
    
    it("returns 400 when delivery not found", async () => {
      (Delivery.findOne as jest.Mock).mockResolvedValue(null);
      
      const res = mockRes();
      await deliveryControllers.delete({ params: { deliveryId: "not-found" } } as any, res);
      
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Error deleting delivery" })
      );
      expect(console.error).toHaveBeenCalledWith(
        "Error deleting delivery:", 
        expect.any(Error)
      );
    });
  });

  describe("getByDriver", () => {
    it("returns deliveries by driver (200)", async () => {
      const deliveries = [
        { deliveryId: "d1", assignedTo: "driver1" },
        { deliveryId: "d2", assignedTo: "driver1" }
      ];
      (Delivery.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockReturnValue(deliveries) });
      (userControllers.getId as jest.Mock).mockResolvedValueOnce({ id: "driver1" });

      const res = mockRes();
      await deliveryControllers.getByDriver({ query: { driverId: "driver1" } } as any, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ delivery: deliveries }));
    });

    it("returns 404 if driver has no deliveries", async () => {
      (Delivery.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockReturnValue([]) });

      const res = mockRes();
      await deliveryControllers.getByDriver({ query: { driverId: "unknown" } } as any, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: "Error fetching deliveries by driver" }));
    });
  });

  describe("getAllActive", () => {
    it("returns active deliveries (200)", async () => {
      const results = [{ deliveryId: "d1", status: "in-progress", assignedTo: "u1" }];
      (Delivery.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockReturnValue(results) });
      (userControllers.getId as jest.Mock).mockResolvedValueOnce({ id: "u1" });

      const res = mockRes();
      await deliveryControllers.getAllActive({} as any, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("getByDate", () => {
    it("returns deliveries by date range (200)", async () => {
      const results = [{ deliveryId: "d1", assignedTo: "u1", scheduledTime: new Date() }];
      (Delivery.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockReturnValue(results) });
      (userControllers.getId as jest.Mock).mockResolvedValueOnce({ id: "u1" });

      const res = mockRes();
      await deliveryControllers.getByDate({ body: { startDate: new Date(), endDate: new Date() } } as any, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalled();
    });

    it("returns 400 if missing dates or no results", async () => {
      const res = mockRes();
      await deliveryControllers.getByDate({ body: {} } as any, res);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });
  });
});