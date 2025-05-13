import { routeSuggestionControllers } from "../../controllers/routeSuggestion.controller";
import { HTTP_STATUS } from "../../types/http-status-codes";
import RouteSuggestion from "../../models/routeSuggestion.model";
import axios from "axios";

jest.mock("../../models/routeSuggestion.model");
jest.mock("axios");

const mockRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
  send: jest.fn(),
}) as any;

describe("RouteSuggestionController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new route suggestion", async () => {
      (RouteSuggestion.findOne as jest.Mock).mockResolvedValue(null);
      (RouteSuggestion.prototype.save as jest.Mock).mockResolvedValue({
        routeSuggestionId: "123",
      });

      const req = {
        body: {
          routeSuggestionId: "123",
          deliveryId: "DEL-1",
          suggestedRoute: "A-B-C",
          estimatedTime: 35,
          createdAt: new Date(),
        },
      } as any;

      const res = mockRes();
      await routeSuggestionControllers.create(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ routeSuggestionId: "123" })
      );
    });

    it("should return 400 if route suggestion exists", async () => {
      (RouteSuggestion.findOne as jest.Mock).mockResolvedValue({});

      const req = {
        body: {
          routeSuggestionId: "123",
        },
      } as any;

      const res = mockRes();
      await routeSuggestionControllers.create(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe("getAll", () => {
    it("should return all route suggestions", async () => {
      (RouteSuggestion.find as jest.Mock).mockResolvedValue([{ routeSuggestionId: "1" }]);
      const req = {} as any;
      const res = mockRes();

      await routeSuggestionControllers.getAll(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalledWith(expect.any(Array));
    });

    it("should handle error", async () => {
      (RouteSuggestion.find as jest.Mock).mockRejectedValue(new Error("Error"));
      const req = {} as any;
      const res = mockRes();

      await routeSuggestionControllers.getAll(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe("getById", () => {
    it("should return a route suggestion by ID", async () => {
      (RouteSuggestion.findOne as jest.Mock).mockResolvedValue({
        toObject: () => ({
          routeSuggestionId: "123",
          deliveryId: "DEL-1",
          suggestedRoute: "A-B-C",
          estimatedTime: 40,
          createdAt: new Date(),
        }),
        routeSuggestionId: "123",
        deliveryId: "DEL-1",
        suggestedRoute: "A-B-C",
        estimatedTime: 40,
        createdAt: new Date(),
      });

      const req = { params: { routeSuggestionId: "123" } } as any;
      const res = mockRes();

      await routeSuggestionControllers.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ routeSuggestionId: "123" })
      );
    });

    it("should return 404 if not found", async () => {
      (RouteSuggestion.findOne as jest.Mock).mockResolvedValue(null);
      const req = { params: { routeSuggestionId: "999" } } as any;
      const res = mockRes();

      await routeSuggestionControllers.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe("update", () => {
    it("should update an existing route suggestion", async () => {
      (RouteSuggestion.findOne as jest.Mock).mockResolvedValue({ routeSuggestionId: "123" });
      (RouteSuggestion.findOneAndUpdate as jest.Mock).mockResolvedValue({
        routeSuggestionId: "123",
        suggestedRoute: "X-Y-Z",
      });

      const req = {
        params: { routeSuggestionId: "123" },
        body: { suggestedRoute: "X-Y-Z" },
      } as any;

      const res = mockRes();
      await routeSuggestionControllers.update(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ suggestedRoute: "X-Y-Z" })
      );
    });

    it("should handle update error", async () => {
      (RouteSuggestion.findOne as jest.Mock).mockResolvedValue(null);

      const req = {
        params: { routeSuggestionId: "999" },
        body: {},
      } as any;

      const res = mockRes();
      await routeSuggestionControllers.update(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe("delete", () => {
    it("should delete a route suggestion", async () => {
      (RouteSuggestion.findOne as jest.Mock).mockResolvedValue({ routeSuggestionId: "123" });
      (RouteSuggestion.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      const req = { params: { routeSuggestionId: "123" } } as any;
      const res = mockRes();

      await routeSuggestionControllers.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
    });

    it("should return 400 if route not found", async () => {
      (RouteSuggestion.findOne as jest.Mock).mockResolvedValue(null);

      const req = { params: { routeSuggestionId: "999" } } as any;
      const res = mockRes();

      await routeSuggestionControllers.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe("routeFromMap", () => {
    it("should return route data from GraphHopper", async () => {
      (axios.get as jest.Mock).mockResolvedValue({ data: { paths: [] } });

      const req = { body: { start: [1, 2], end: [3, 4] } } as any;
      const res = mockRes();
      process.env.GRASS = "fake-api-key";

      await routeSuggestionControllers.routeFromMap(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalledWith({ paths: [] });
    });

    it("should handle missing start or end", async () => {
      const req = { body: {} } as any;
      const res = mockRes();

      await routeSuggestionControllers.routeFromMap(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });
  });
});
