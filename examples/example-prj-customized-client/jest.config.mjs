export default {
  preset: "ts-jest",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { diagnostics: false }],
  },
  setupFilesAfterEnv: ["<rootDir>/setupAfterEnv.ts"],
  testEnvironment: "@quramy/jest-prisma-node/environment",
};
