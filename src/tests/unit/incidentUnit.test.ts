import Incident from "../../models/incident.model";
import { incidentControllers } from "../../controllers/incidents.controller";
import { userControllers } from "../../controllers/user.controller";
import { HTTP_STATUS } from "../../types/http-status-codes";

jest.mock("../../models/incident.model", () => {
  const M: any = jest.fn();
  ["find", "findOne", "deleteOne", "findOneAndUpdate"].forEach((m) => (M[m] = jest.fn()));
  M.prototype.save = jest.fn();
  return M;
});

jest.mock("../../controllers/user.controller", () => ({
  userControllers: {
    getId: jest.fn(),
  },
}));

const mockRes = () =>
  ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    send: jest.fn(),
  }) as any;

describe("Incident Controller", () => {
  beforeEach(() => jest.clearAllMocks());

  it("creates an incident", async () => {
    (Incident.prototype.save as jest.Mock).mockResolvedValueOnce({ incidentId: "i1" });

    const req = {
      body: {
        reportedBy: "u1",
        deliveryId: "d1",
        type: "delay",
        description: "late",
        location: "Zone A"
      }
    };
    const res = mockRes();

    await incidentControllers.create(req as any, res);

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ incidentId: "i1" }));
  });

  it("returns all incidents", async () => {
    const mockResults = [{ reportedBy: "u1" }];
    (Incident.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockReturnValue(mockResults) });
    (userControllers.getId as jest.Mock).mockResolvedValue({ id: "u1" });

    const res = mockRes();
    await incidentControllers.getAll({} as any, res);

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
    expect(res.json).toHaveBeenCalled();
  });

  it("gets open incidents", async () => {
    const mockResults = [{ reportedBy: "u2" }];
    (Incident.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockReturnValue(mockResults) });
    (userControllers.getId as jest.Mock).mockResolvedValue({ id: "u2" });

    const res = mockRes();
    await incidentControllers.getOpenIncidents({} as any, res);

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
    expect(res.json).toHaveBeenCalled();
  });

  it("gets incident by driver", async () => {
    const mockResults = [{ reportedBy: "u3" }];
    (Incident.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockReturnValue(mockResults) });
    (userControllers.getId as jest.Mock).mockResolvedValue({ id: "u3" });

    const res = mockRes();
    await incidentControllers.getByDriver({ query: { driverId: "u3" } } as any, res);

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
    expect(res.json).toHaveBeenCalled();
  });

  it("gets incident by ID", async () => {
    const mockIncident = {
      incidentId: "i1",
      reportedBy: "u1",
      deliveryId: "d1",
      type: "damage",
      description: "box broken",
      status: "open",
      location: "Zone B",
      toObject: () => ({
        incidentId: "i1",
        reportedBy: "u1",
        deliveryId: "d1",
        type: "damage",
        description: "box broken",
        status: "open",
        location: "Zone B",
      }),
    };
    (Incident.findOne as jest.Mock).mockResolvedValueOnce(mockIncident);

    const res = mockRes();
    await incidentControllers.getById({ params: { incidentId: "i1" } } as any, res);

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ incidentId: "i1" }));
  });

  it("updates incident", async () => {
    (Incident.findOne as jest.Mock).mockResolvedValueOnce({ incidentId: "i1" });
    (Incident.findOneAndUpdate as jest.Mock).mockResolvedValueOnce({ incidentId: "i1", status: "resolved" });

    const res = mockRes();
    await incidentControllers.update({ params: { incidentId: "i1" }, body: { status: "resolved" } } as any, res);

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "resolved" }));
  });

  it("deletes incident", async () => {
    (Incident.findOne as jest.Mock).mockResolvedValueOnce({ incidentId: "i1" });
    (Incident.deleteOne as jest.Mock).mockResolvedValueOnce({ deletedCount: 1 });

    const res = mockRes();
    await incidentControllers.delete({ params: { incidentId: "i1" } } as any, res);

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
    expect(res.json).toHaveBeenCalled();
  });
});
