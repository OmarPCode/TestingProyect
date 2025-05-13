import { Response } from "supertest";

let lastResponse: Response | undefined;

export const setLastResponse = (res: Response) => {
  lastResponse = res;
};

export const getLastResponse = (): Response => {
  if (!lastResponse) {
    throw new Error("No response has been set");
  }
  return lastResponse;
};
