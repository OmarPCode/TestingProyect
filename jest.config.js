module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  globalTeardown: "./jest-teardown.js",
  testMatch: ["**/tests/**/*.test.ts"],
  collectCoverage: true,
  coverageThreshold: {
    global: {
      statements: 30,
      branches: 14,
      functions: 25,
      lines: 30,
    },
  },
};
