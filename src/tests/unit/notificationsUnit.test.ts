
import Notification from "../../models/notification.model";

jest.mock("../../models/notification.model", () => {
  const M: any = jest.fn();
  ["find", "findOne", "findOneAndUpdate", "deleteOne"].forEach(
    (m) => (M[m] = jest.fn()),
  );
  return M;
});

import { notificationControllers, userControllers } from "../../controllers";
import { HTTP_STATUS } from "../../types/http-status-codes";

/* helpers */
const resMock = () =>
  ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    send: jest.fn(),
  }) as any;

const makeQuery = (r: any) => ({ sort: jest.fn().mockReturnValueOnce(r) });

describe("Notification Controller", () => {
  describe("create", () => {
    it("creates notification", async () => {
      (Notification.findOne as jest.Mock).mockResolvedValueOnce(null);
      const body = {
        notificationId: "n1",
        userId: "u1",
        message: "hola",
        type: "info",
        status: "unread",
        createdAt: new Date(),
      };

      (Notification as unknown as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockResolvedValueOnce(body),
      }));

      const res = resMock();
      await notificationControllers.create({ body } as any, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalledWith(body);
    });

    it("400 si ya existe", async () => {
      (Notification.findOne as jest.Mock).mockResolvedValueOnce({});

      const res = resMock();
      await notificationControllers.create(
        { body: { notificationId: "dup" } } as any,
        res,
      );

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe("getAll", () => {
    it("lista todas", async () => {
      const list = [{ notificationId: "n1" }];
      (Notification.find as jest.Mock).mockReturnValueOnce(makeQuery(list));

      const res = resMock();
      await notificationControllers.getAll({} as any, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalledWith(list);
    });

    it("404 lista vacía", async () => {
      (Notification.find as jest.Mock).mockReturnValueOnce(makeQuery([]));

      const res = resMock();
      await notificationControllers.getAll({} as any, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
    });
  });

  describe("getById", () => {
    it("obtiene por id", async () => {
      const doc = {
        notificationId: "n1",
        toObject: () => ({ notificationId: "n1" }),
      };
      (Notification.findOne as jest.Mock).mockResolvedValueOnce(doc);

      const res = resMock();
      await notificationControllers.getById(
        { params: { notificationId: "n1" } } as any,
        res,
      );

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
    });

    it("404 si no existe", async () => {
      (Notification.findOne as jest.Mock).mockResolvedValueOnce(null);

      const res = resMock();
      await notificationControllers.getById(
        { params: { notificationId: "x" } } as any,
        res,
      );

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe("update", () => {
    it("actualiza ok", async () => {
      (Notification.findOne as jest.Mock).mockResolvedValueOnce({});
      (Notification.findOneAndUpdate as jest.Mock).mockResolvedValueOnce({
        notificationId: "n1",
        status: "read",
      });

      const res = resMock();
      await notificationControllers.update(
        {
          params: { notificationId: "n1" },
          body: { status: "read" },
        } as any,
        res,
      );

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
    });

    it("400 si no existe", async () => {
      (Notification.findOne as jest.Mock).mockResolvedValueOnce(null);

      const res = resMock();
      await notificationControllers.update(
        { params: { notificationId: "x" }, body: {} } as any,
        res,
      );

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe("delete", () => {
    it("elimina ok", async () => {
      (Notification.findOne as jest.Mock).mockResolvedValueOnce({});
      (Notification.deleteOne as jest.Mock).mockResolvedValueOnce({
        acknowledged: true,
        deletedCount: 1,
      });

      const res = resMock();
      await notificationControllers.delete(
        { params: { notificationId: "n1" } } as any,
        res,
      );

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
    });

    it("400 si no existe", async () => {
      (Notification.findOne as jest.Mock).mockResolvedValueOnce(null);

      const res = resMock();
      await notificationControllers.delete(
        { params: { notificationId: "x" } } as any,
        res,
      );

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });
  });
});