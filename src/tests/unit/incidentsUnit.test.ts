import Incident from "../../models/incident.model";
import { incidentControllers } from "../../controllers/incidents.controller";
import { HTTP_STATUS } from "../../types/http-status-codes";
import { Request, Response } from "express";

// Mock model methods
jest.mock("../../models/incident.model", () => {
  const M: any = jest.fn();
  ["find", "findOne", "findOneAndUpdate", "deleteOne"].forEach(
    (m) => (M[m] = jest.fn())
  );
  return M;
});

// Silence console.error
jest.spyOn(console, "error").mockImplementation(() => {});

const mockReq = (body = {}, params = {}, query = {}): Request & any => ({ body, params, query });
const mockRes = (): Response & any => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res as Response);
  res.json   = jest.fn().mockReturnValue(res as Response);
  res.send   = jest.fn().mockReturnValue(res as Response);
  return res as Response;
};

describe("Incident Controller Unit Tests", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("create", () => {
    it("handles save() errors", async () => {
      (Incident as unknown as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error("save error")),
      }));

      const req = mockReq({});
      const res = mockRes();
      await incidentControllers.create(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Error creating incident" })
      );
      expect(console.error).toHaveBeenCalledWith(
        "Error creating incident:",
        expect.any(Error)
      );
    });
  });

  describe("getAll", () => {
    it("returns 404 when no incidents found", async () => {
      (Incident.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
      });

      const res = mockRes();
      await incidentControllers.getAll({} as any, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(res.send).toHaveBeenCalledWith({ message: "No incidents found" });
    });
  });

  describe("getById", () => {
    it("returns 404 when incident not found", async () => {
      (Incident.findOne as jest.Mock).mockResolvedValue(null);

      const req = mockReq({}, { incidentId: "iX" });
      const res = mockRes();
      await incidentControllers.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(res.send).toHaveBeenCalledWith({ message: "Error fetching incident" });
    });
  });

  describe("update", () => {
    it("updates an incident successfully", async () => {
      (Incident.findOne as jest.Mock).mockResolvedValue({ incidentId: "i1" });
      (Incident.findOneAndUpdate as jest.Mock).mockResolvedValue({ incidentId: "i1", description: "new" });

      const req = mockReq({ description: "new" }, { incidentId: "i1" });
      const res = mockRes();
      await incidentControllers.update(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalledWith({ incidentId: "i1", description: "new" });
    });

    it("returns 400 when incident to update not found", async () => {
      (Incident.findOne as jest.Mock).mockResolvedValue(null);

      const req = mockReq({}, { incidentId: "iX" });
      const res = mockRes();
      await incidentControllers.update(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.send).toHaveBeenCalledWith({ message: "Error updating incident" });
    });
  });

  describe("delete", () => {
    it("deletes an incident successfully", async () => {
      (Incident.findOne as jest.Mock).mockResolvedValue({ incidentId: "i1" });
      (Incident.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      const req = mockReq({}, { incidentId: "i1" });
      const res = mockRes();
      await incidentControllers.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalledWith({ deletedCount: 1 });
    });

    it("returns 400 when incident to delete not found", async () => {
      (Incident.findOne as jest.Mock).mockResolvedValue(null);

      const req = mockReq({}, { incidentId: "iX" });
      const res = mockRes();
      await incidentControllers.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.send).toHaveBeenCalledWith({ message: "Error deleting incident" });
    });
  });
});