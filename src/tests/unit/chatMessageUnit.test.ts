import ChatMessage from "../../models/chatMessage.model";
import { chatMessageControllers } from "../../controllers/chatMessage.controller";
import { HTTP_STATUS } from "../../types/http-status-codes";

jest.mock("../../models/chatMessage.model", () => {
  const M: any = jest.fn();
  ["find", "findOne", "deleteOne", "findOneAndUpdate"].forEach((m) => (M[m] = jest.fn()));
  M.prototype.save = jest.fn();
  return M;
});

const mockRes = () =>
  ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    send: jest.fn(),
  }) as any;

describe("ChatMessage Controller", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("create", () => {
    it("creates a chat message", async () => {
      (ChatMessage.findOne as jest.Mock).mockResolvedValueOnce(null);
      (ChatMessage.prototype.save as jest.Mock).mockResolvedValueOnce({ messageId: "m1" });

      const req = {
        body: {
          messageId: "m1",
          fromUserId: "u1",
          toUserId: "u2",
          deliveryId: "d1",
          content: "Hello",
          createdAt: new Date(),
        },
      };

      const res = mockRes();
      await chatMessageControllers.create(req as any, res);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ messageId: "m1" }));
    });

    it("returns 400 if message exists", async () => {
      (ChatMessage.findOne as jest.Mock).mockResolvedValueOnce({ messageId: "m1" });

      const res = mockRes();
      await chatMessageControllers.create({ body: { messageId: "m1" } } as any, res);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe("getMessagesByRoom", () => {
    it("returns messages by room", async () => {
      (ChatMessage.find as jest.Mock).mockResolvedValueOnce([{ messageId: "m1" }]);

      const res = mockRes();
      await chatMessageControllers.getMessagesByRoom({ params: { roomName: "d1" } } as any, res);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalledWith(expect.any(Array));
    });

    it("returns 400 on error", async () => {
      (ChatMessage.find as jest.Mock).mockRejectedValueOnce(new Error("fail"));

      const res = mockRes();
      await chatMessageControllers.getMessagesByRoom({ params: { roomName: "d1" } } as any, res);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe("getAll", () => {
    it("returns all messages", async () => {
      (ChatMessage.find as jest.Mock).mockResolvedValueOnce([{ messageId: "m1" }]);

      const res = mockRes();
      await chatMessageControllers.getAll({} as any, res);
      expect(res.send).toHaveBeenCalledWith(expect.any(Array));
    });

    it("returns 404 on error", async () => {
      (ChatMessage.find as jest.Mock).mockRejectedValueOnce(new Error("fail"));

      const res = mockRes();
      await chatMessageControllers.getAll({} as any, res);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe("getById", () => {
    it("returns message by ID", async () => {
      const msg = {
        messageId: "m1",
        content: "Hi",
        toObject: () => ({ messageId: "m1", content: "Hi" }),
      };
      (ChatMessage.findOne as jest.Mock).mockResolvedValueOnce(msg);

      const res = mockRes();
      await chatMessageControllers.getById({ params: { messageId: "m1" } } as any, res);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ messageId: "m1" }));
    });

    it("returns 404 if not found", async () => {
      (ChatMessage.findOne as jest.Mock).mockResolvedValueOnce(null);

      const res = mockRes();
      await chatMessageControllers.getById({ params: { messageId: "invalid" } } as any, res);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe("update", () => {
    it("updates message successfully", async () => {
      (ChatMessage.findOne as jest.Mock).mockResolvedValueOnce({ messageId: "m1" });
      (ChatMessage.findOneAndUpdate as jest.Mock).mockResolvedValueOnce({ messageId: "m1", content: "updated" });

      const res = mockRes();
      await chatMessageControllers.update({
        params: { messageId: "m1" },
        body: { content: "updated" },
      } as any, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ content: "updated" }));
    });

    it("returns 400 if not found", async () => {
      (ChatMessage.findOne as jest.Mock).mockResolvedValueOnce(null);

      const res = mockRes();
      await chatMessageControllers.update({ params: { messageId: "x" }, body: {} } as any, res);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe("delete", () => {
    it("deletes message", async () => {
      (ChatMessage.findOne as jest.Mock).mockResolvedValueOnce({ messageId: "m1" });
      (ChatMessage.deleteOne as jest.Mock).mockResolvedValueOnce({ deletedCount: 1 });

      const res = mockRes();
      await chatMessageControllers.delete({ params: { messageId: "m1" } } as any, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalled();
    });

    it("returns 400 if message not found", async () => {
      (ChatMessage.findOne as jest.Mock).mockResolvedValueOnce(null);

      const res = mockRes();
      await chatMessageControllers.delete({ params: { messageId: "x" } } as any, res);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });
  });
});
