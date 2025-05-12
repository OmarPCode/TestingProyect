import Ranking from "../../models/ranking.model";

jest.mock("../../models/ranking.model", () => {
  const M: any = jest.fn();
  ["find", "findOne", "findOneAndUpdate", "deleteOne"].forEach(
    (m) => (M[m] = jest.fn()),
  );
  return M;
});

jest.mock("../../controllers/user.controller", () => ({
  userControllers: {
    getId: jest.fn()
  }
}));

import { rankingControllers } from "../../controllers";
import { userControllers } from "../../controllers/user.controller";
import { HTTP_STATUS } from "../../types/http-status-codes";

const resMock = () =>
  ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    send: jest.fn(),
  }) as any;

const makeQuery = (result: any) => ({
  sort: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue(result)
});

describe("Ranking Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe("create", () => {
    it("creates ranking when none exists", async () => {
      (Ranking.findOne as jest.Mock).mockResolvedValueOnce(null);

      const body = { userId: "u1", points: 0, rank: 1 };
      const saved = { ...body };

      (Ranking as unknown as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockResolvedValueOnce(saved),
      }));

      const res = resMock();
      await rankingControllers.create({ body } as any, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalledWith(saved);
    });

    it("returns 400 if ranking already exists", async () => {
      (Ranking.findOne as jest.Mock).mockResolvedValueOnce({ userId: "u1" });

      const res = resMock();
      await rankingControllers.create({ body: { userId: "u1" } } as any, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe("getAll", () => {
    it("returns list with users", async () => {
      const list = [
        { userId: "u1", points: 10, rank: 1 },
        { userId: "u2", points: 5, rank: 2 },
      ];
      
      (Ranking.find as jest.Mock).mockReturnValueOnce({
        sort: jest.fn().mockReturnValue(list)
      });

      (userControllers.getId as jest.Mock)
        .mockResolvedValueOnce({ userId: "u1" })
        .mockResolvedValueOnce({ userId: "u2" });

      const res = resMock();
      await rankingControllers.getAll({} as any, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalledWith({
        rankings: list,
        users: [{ userId: "u1" }, { userId: "u2" }],
      });
    });

    it("returns 404 when list empty", async () => {
      (Ranking.find as jest.Mock).mockReturnValueOnce({
        sort: jest.fn().mockImplementation(() => {
          throw new Error("No rankings found");
        })
      });
      
      const res = resMock();
      await rankingControllers.getAll({} as any, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe("getById", () => {
    it("returns ranking by id", async () => {
      const doc = { 
        userId: "u1", 
        points: 0, 
        rank: 1, 
        toObject: () => ({ userId: "u1", points: 0, rank: 1 }) 
      };
      (Ranking.findOne as jest.Mock).mockResolvedValueOnce(doc);

      const res = resMock();
      await rankingControllers.getById(
        { params: { rankingId: "u1" } } as any,
        res,
      );

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalled();
    });

    it("404 when not found", async () => {
      (Ranking.findOne as jest.Mock).mockResolvedValueOnce(null);

      const res = resMock();
      await rankingControllers.getById(
        { params: { rankingId: "uX" } } as any,
        res,
      );

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe("update", () => {
    it("updates successfully", async () => {
      (Ranking.findOne as jest.Mock).mockResolvedValueOnce({ userId: "u1" });
      (Ranking.findOneAndUpdate as jest.Mock).mockResolvedValueOnce({
        userId: "u1",
        points: 10,
      });

      const res = resMock();
      await rankingControllers.update(
        { params: { rankingId: "u1" }, body: { points: 10 } } as any,
        res,
      );

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
    });

    it("400 when not exists", async () => {
      (Ranking.findOne as jest.Mock).mockResolvedValueOnce(null);

      const res = resMock();
      await rankingControllers.update(
        { params: { rankingId: "uX" }, body: {} } as any,
        res,
      );

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe("delete", () => {
    it("deletes successfully", async () => {
      (Ranking.findOne as jest.Mock).mockResolvedValueOnce({ userId: "u1" });
      (Ranking.deleteOne as jest.Mock).mockResolvedValueOnce({
        acknowledged: true,
        deletedCount: 1,
      });

      const res = resMock();
      await rankingControllers.delete(
        { params: { rankingId: "u1" } } as any,
        res,
      );

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
    });

    it("400 when not exists", async () => {
      (Ranking.findOne as jest.Mock).mockResolvedValueOnce(null);

      const res = resMock();
      await rankingControllers.delete(
        { params: { rankingId: "uX" } } as any,
        res,
      );

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });
  });
});