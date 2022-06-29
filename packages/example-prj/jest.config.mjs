export default {
  preset: "ts-jest",
  globals: {
    "ts-jest": {
      diagnostics: false,
    },
  },
  testEnvironment: "@quramy/jest-prisma/environment",
};
