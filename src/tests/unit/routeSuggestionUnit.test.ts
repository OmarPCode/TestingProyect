import { Request, Response } from "express";
import axios from "axios";
import RouteSuggestion from "../../models/routeSuggestion.model";
import { routeSuggestionControllers } from "../../controllers/routeSuggestion.controller";
import { HTTP_STATUS } from "../../types/http-status-codes";
import { RouteSuggestion as RouteType } from "../../types/routeSuggestion";
import xss from "xss";

jest.mock("../../models/routeSuggestion.model", () => {
  const M: any = jest.fn();
  ["findOne", "find", "findOneAndUpdate", "deleteOne"].forEach(
    (m) => (M[m] = jest.fn())
  );
  return M;
});

jest.mock("axios");

jest.spyOn(console, "error").mockImplementation(() => {});

describe("RouteSuggestion Controller Unit Tests", () => {
  const mockReq = (body = {}, params = {}): Request & any => ({ body, params });
  const mockRes = (): Response & any => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res as Response);
    res.json = jest.fn().mockReturnValue(res as Response);
    res.send = jest.fn().mockReturnValue(res as Response);
    return res as Response;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new suggestion when none exists", async () => {
      const body: RouteType = {
        routeSuggestionId: "r1",
        deliveryId: "d1",
        suggestedRoute: "route",
        estimatedTime: "10m",
        createdAt: new Date()
      };

      (RouteSuggestion.findOne as jest.Mock).mockResolvedValueOnce(null);
      (RouteSuggestion as unknown as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockResolvedValueOnce(body),
      }));

      const req = mockReq(body);
      const res = mockRes();
      await routeSuggestionControllers.create(req, res);

      expect(RouteSuggestion.findOne).toHaveBeenCalledWith({ routeSuggestionId: "r1" });
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalledWith(body);
    });

    it("should return 400 if suggestion already exists", async () => {
      (RouteSuggestion.findOne as jest.Mock).mockResolvedValueOnce({});

      const req = mockReq({ routeSuggestionId: "r1" });
      const res = mockRes();
      await routeSuggestionControllers.create(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.send).toHaveBeenCalledWith({ message: "Error creating route suggestion" });
    });

    it("should return 400 on save error", async () => {
      (RouteSuggestion.findOne as jest.Mock).mockResolvedValueOnce(null);
      (RouteSuggestion as unknown as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockRejectedValueOnce(new Error("save error")),
      }));

      const req = mockReq({ routeSuggestionId: "r1" });
      const res = mockRes();
      await routeSuggestionControllers.create(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.send).toHaveBeenCalledWith({ message: "Error creating route suggestion" });
    });
  });

  describe("getAll", () => {
    it("should return all suggestions", async () => {
      const list = [{ routeSuggestionId: "r1" }];
      (RouteSuggestion.find as jest.Mock).mockResolvedValueOnce(list);

      const req = mockReq();
      const res = mockRes();
      await routeSuggestionControllers.getAll(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalledWith(list);
    });

    it("should return 404 on fetch error", async () => {
      (RouteSuggestion.find as jest.Mock).mockRejectedValueOnce(new Error("fetch error"));

      const req = mockReq();
      const res = mockRes();
      await routeSuggestionControllers.getAll(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(res.send).toHaveBeenCalledWith({ message: "No route suggestions found" });
    });
  });

  describe("getById", () => {
    it("should return 404 when not found", async () => {
      (RouteSuggestion.findOne as jest.Mock).mockResolvedValueOnce(null);

      const req = mockReq({}, { routeSuggestionId: "rX" });
      const res = mockRes();
      await routeSuggestionControllers.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(res.send).toHaveBeenCalledWith({ message: "Error fetching route suggestion" });
    });
  });

  describe("update", () => {
    it("should update suggestion successfully", async () => {
      const existing = { routeSuggestionId: "r1" };
      const updated = { routeSuggestionId: "r1", estimatedTime: "15m" };

      (RouteSuggestion.findOne as jest.Mock).mockResolvedValueOnce(existing);
      (RouteSuggestion.findOneAndUpdate as jest.Mock).mockResolvedValueOnce(updated);

      const req = mockReq({ estimatedTime: "15m" }, { routeSuggestionId: "r1" });
      const res = mockRes();
      await routeSuggestionControllers.update(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it("should return 400 when not exists", async () => {
      (RouteSuggestion.findOne as jest.Mock).mockResolvedValueOnce(null);

      const req = mockReq({}, { routeSuggestionId: "rX" });
      const res = mockRes();
      await routeSuggestionControllers.update(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.send).toHaveBeenCalledWith({ message: "Error updating route suggestion" });
    });
  });

  describe("delete", () => {
    it("should delete suggestion successfully", async () => {
      (RouteSuggestion.findOne as jest.Mock).mockResolvedValueOnce({});
      (RouteSuggestion.deleteOne as jest.Mock).mockResolvedValueOnce({ deletedCount: 1 });

      const req = mockReq({}, { routeSuggestionId: "r1" });
      const res = mockRes();
      await routeSuggestionControllers.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalledWith({ deletedCount: 1 });
    });

    it("should return 400 when not exists", async () => {
      (RouteSuggestion.findOne as jest.Mock).mockResolvedValueOnce(null);

      const req = mockReq({}, { routeSuggestionId: "rX" });
      const res = mockRes();
      await routeSuggestionControllers.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.send).toHaveBeenCalledWith({ message: "Error deleting route suggestion" });
    });
  });

  describe("routeFromMap", () => {
    it("should fetch route data successfully", async () => {
      const mapData: any = { path: [] };
      (axios.get as jest.Mock).mockResolvedValueOnce({ data: mapData });

      const req = mockReq({ start: [0,0], end: [1,1] });
      const res = mockRes();
      process.env.GRASS = "APIKEY";
      await routeSuggestionControllers.routeFromMap(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalledWith(mapData);
    });

    it("should return 400 on missing params", async () => {
      const req = mockReq({ start: null, end: null });
      const res = mockRes();
      await routeSuggestionControllers.routeFromMap(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.send).toHaveBeenCalledWith({ message: "Error fetching route from map" });
    });

    it("should return 400 on missing API key", async () => {
      delete process.env.GRASS;
      const req = mockReq({ start: [0,0], end: [1,1] });
      const res = mockRes();
      await routeSuggestionControllers.routeFromMap(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.send).toHaveBeenCalledWith({ message: "Error fetching route from map" });
    });

    it("should return 400 on axios error", async () => {
      process.env.GRASS = "APIKEY";
      (axios.get as jest.Mock).mockRejectedValueOnce(new Error("http error"));
      const req = mockReq({ start: [0,0], end: [1,1] });
      const res = mockRes();
      await routeSuggestionControllers.routeFromMap(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.send).toHaveBeenCalledWith({ message: "Error fetching route from map" });
    });
  });
});