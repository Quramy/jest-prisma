export default {
  preset: "ts-jest",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { diagnostics: false }],
  },
  testEnvironment: "<rootDir>/jest/clientExtensionEnv.ts",
};
