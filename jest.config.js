module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  globalTeardown: "./jest-teardown.js",
  testMatch: ["**/tests/**/*.test.ts"],
  collectCoverage: true,
  coverageThreshold: {
    global: {
      statements: 55,
      branches: 50,
      functions: 50,
      lines: 50,
    },
  },
};
