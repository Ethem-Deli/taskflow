import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  globalSetup: "<rootDir>/jest.global-setup.js",
  setupFiles: ["<rootDir>/jest.env.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.test.json",
      },
    ],
  },
  testMatch: ["<rootDir>/src/__tests__/**/*.test.ts"],
  // SQLite doesn't handle concurrent writes well — run serially
  maxWorkers: 1,
};

export default config;
