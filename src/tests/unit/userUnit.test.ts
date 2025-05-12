import { userControllers } from "../../controllers";
import User from "../../models/user.model";
import { HTTP_STATUS } from "../../types/http-status-codes";
import bcrypt from "bcrypt";
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
      plain === "password123" && hashed === "hashed_password123",
  ),
}));

jest.spyOn(console, 'error').mockImplementation(() => {});

const mockRequest = (body = {}, params = {}, query = {}) => {
  return { body, params, query } as Request;
};

const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe("User Controller Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("should return all users with status 200", async () => {
      const mockUsers = [
        { 
          name: "Test User", 
          email: "test@example.com",
          toObject: jest.fn().mockReturnValue({ name: "Test User", email: "test@example.com" })
        },
        { 
          name: "Another User", 
          email: "another@example.com",
          toObject: jest.fn().mockReturnValue({ name: "Another User", email: "another@example.com" })
        }
      ];
      (User.find as jest.Mock).mockResolvedValue(mockUsers);

      const req = mockRequest();
      const res = mockResponse();
      
      await userControllers.getAll(req, res);

      expect(User.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalled();
    });

    it("should return 404 when no users found", async () => {
      (User.find as jest.Mock).mockRejectedValue(new Error("No users found"));

      const req = mockRequest();
      const res = mockResponse();
      
      await userControllers.getAll(req, res);

      expect(User.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(res.send).toHaveBeenCalledWith({
        message: "No users found"
      });
    });

    it("should handle database errors correctly", async () => {
      (User.find as jest.Mock).mockRejectedValue(new Error("Database error"));

      const req = mockRequest();
      const res = mockResponse();
      
      await userControllers.getAll(req, res);

      expect(User.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(res.send).toHaveBeenCalledWith({
        message: "No users found"
      });
    });
  });

  describe("getById", () => {
    it("should return a user by ID with status 200", async () => {
      const mockUser = { 
        name: "Test User", 
        email: "test@example.com",
        toObject: jest.fn().mockReturnValue({ 
          name: "Test User", 
          email: "test@example.com" 
        })
      };
      
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const req = mockRequest({}, { userId: "123" });
      const res = mockResponse();
      
      await userControllers.getById(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ userId: "123" }, { password: 0 });
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SUCCESS);
      expect(res.json).toHaveBeenCalled();
    });

    it("should return 404 when user not found", async () => {
      (User.findOne as jest.Mock).mockRejectedValue(new Error("User does not exist"));

      const req = mockRequest({}, { userId: "nonexistent" });
      const res = mockResponse();
      
      await userControllers.getById(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ userId: "nonexistent" }, { password: 0 });
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(res.send).toHaveBeenCalledWith({ message: "Error fetching user" });
    });

    it("should handle when user exists but toObject fails", async () => {
      const mockUser = { 
        name: "Test User", 
        email: "test@example.com"
      };
      
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const req = mockRequest({}, { userId: "123" });
      const res = mockResponse();
      
      await userControllers.getById(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ userId: "123" }, { password: 0 });
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.NOT_FOUND);
      expect(res.send).toHaveBeenCalledWith({ message: "Error fetching user" });
    });
  });

});