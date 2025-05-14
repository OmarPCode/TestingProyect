import { userControllers } from "../../controllers";
import User from "../../models/user.model";
import { HTTP_STATUS } from "../../types/http-status-codes";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";

jest.mock("../../models/user.model", () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
    create: jest.fn(),
  },
}));
jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashed_password123"),
  compare: jest.fn().mockImplementation(
    async (plain: string, hashed: string) =>
      plain === "password123" && hashed === "hashed_password123"
  ),
}));
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn().mockReturnValue("token123"),
  verify: jest.fn().mockReturnValue({ userId: "u1" }),
}));
jest.spyOn(console, "error").mockImplementation(() => {});

const mockRequest = (body = {}, params = {}, query = {}) =>
  ({ body, params, query } as Request);
const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res as Response);
  res.json = jest.fn().mockReturnValue(res as Response);
  res.send = jest.fn().mockReturnValue(res as Response);
  return res as Response;
};

describe("User Controller Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("should return all users with status 200", async () => {
      const mockUsers = [
        {
          name: "Test User",
          email: "test@example.com",
          toObject: jest.fn().mockReturnValue({ name: "Test User", email: "test@example.com" }),
        },
        {
          name: "Another User",
          email: "another@example.com",
          toObject: jest.fn().mockReturnValue({ name: "Another User", email: "another@example.com" }),
        },
      ];
      (User.find as jest.Mock).mockResolvedValue(mockUsers);

      const req = mockRequest();
      const res = mockResponse();
      await userControllers.getAll(req, res);

      expect(User.find).toHaveBeenCalledWith({}, { password: 0 });
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalledWith(mockUsers);
    });

    it("should return 404 when no users found", async () => {
      (User.find as jest.Mock).mockRejectedValue(new Error("No users found"));

      const req = mockRequest();
      const res = mockResponse();
      await userControllers.getAll(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(res.send).toHaveBeenCalledWith({ message: "No users found" });
    });
  });

  describe("getDrivers", () => {
    it("should return all drivers with status 200", async () => {
      const mockDrivers = [
        {
          name: "Driver One",
          email: "d1@example.com",
          toObject: jest.fn().mockReturnValue({ name: "Driver One", email: "d1@example.com" }),
        },
      ];
      (User.find as jest.Mock).mockResolvedValue(mockDrivers);

      const req = mockRequest();
      const res = mockResponse();
      await userControllers.getDrivers(req, res);

      expect(User.find).toHaveBeenCalledWith({ role: "driver" }, { password: 0 });
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalledWith(mockDrivers);
    });

    it("should return 404 when driver fetch fails", async () => {
      (User.find as jest.Mock).mockRejectedValue(new Error("No drivers"));

      const req = mockRequest();
      const res = mockResponse();
      await userControllers.getDrivers(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(res.send).toHaveBeenCalledWith({ message: "No drivers found" });
    });
  });

  describe("getById", () => {
    it("should return a user by ID with status 200", async () => {
      const mockUser = {
        name: "Test User",
        email: "test@example.com",
        toObject: jest.fn().mockReturnValue({ name: "Test User", email: "test@example.com" }),
        userId: "u1",
        role: "user",
        status: "new",
        profilePic: "",
        createdAt: new Date(),
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const req = mockRequest({}, { userId: "u1" });
      const res = mockResponse();
      await userControllers.getById(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ userId: "u1" }, { password: 0 });
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ userId: "u1" }));
    });

    it("should return 404 when user not found", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const req = mockRequest({}, { userId: "uX" });
      const res = mockResponse();
      await userControllers.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(res.send).toHaveBeenCalledWith({ message: "Error fetching user" });
    });
  });

  describe("update", () => {
    it("should update a user successfully", async () => {
      const existing = { userId: "u1" };
      const updated = { userId: "u1", name: "New Name" };
      (User.findOne as jest.Mock).mockResolvedValue(existing);
      (User.findOneAndUpdate as jest.Mock).mockResolvedValue(updated);

      const req = mockRequest({ name: "New Name" }, { userId: "u1" });
      const res = mockResponse();
      await userControllers.update(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalledWith(updated);
    });

    it("should return 400 when user to update not found", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const req = mockRequest({}, { userId: "uX" });
      const res = mockResponse();
      await userControllers.update(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
      expect(res.send).toHaveBeenCalledWith({ message: "Error updating user" });
    });
  });

  describe("updatePassword", () => {
    it("should update password successfully", async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ userId: "u1", password: "old" });
      const req = mockRequest({ token: "t", newPassword: "newPass123" });
      const res = mockResponse();
      await userControllers.updatePassword(req, res);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
    });

    it("should return 400 on missing fields", async () => {
      const req = mockRequest({ token: "", newPassword: "" });
      const res = mockResponse();
      await userControllers.updatePassword(req, res);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });

    it("should return 400 when user not found", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      const req = mockRequest({ token: "t", newPassword: "pwd" });
      const res = mockResponse();
      await userControllers.updatePassword(req, res);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe("delete", () => {
    it("should delete user successfully", async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ userId: "u1" });
      (User.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      const req = mockRequest({}, { userId: "u1" });
      const res = mockResponse();
      await userControllers.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
    });

    it("should return 400 when user to delete not found", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      const req = mockRequest({}, { userId: "uX" });
      const res = mockResponse();
      await userControllers.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe("register", () => {
    it("should return 400 on missing fields", async () => {
      const req = mockRequest({ email: "no@example.com" });
      const res = mockResponse();
      await userControllers.register(req, res);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });

    it("should return 400 if email exists", async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ email: "exists@example.com" });
      const req = mockRequest({ name: "Bob", email: "exists@example.com", password: "pwd12345", role: "user" });
      const res = mockResponse();
      await userControllers.register(req, res);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });
  });

  describe("login", () => {
    it("should login successfully", async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ userId: "u1", email: "user@example.com", password: "hashed_password123", status: "new", role: "user", name: "User" });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const req = mockRequest({ email: "user@example.com", password: "password123" });
      const res = mockResponse();
      await userControllers.login(req, res);

      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.send).toHaveBeenCalledWith({ token: "token123", message: "Login successful" });
    });

    it("should return 400 on missing fields", async () => {
      const req = mockRequest({ email: "" });
      const res = mockResponse();
      await userControllers.login(req, res);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });

    it("should return 400 on invalid credentials", async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ password: "wrong_hash", status: "new" });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const req = mockRequest({ email: "e", password: "wrong" });
      const res = mockResponse();
      await userControllers.login(req, res);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });

    it("should return 400 when user not active", async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ password: "hashed_password123", status: "deleted" });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const req = mockRequest({ email: "e", password: "password123" });
      const res = mockResponse();
      await userControllers.login(req, res);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
    });
  });
});