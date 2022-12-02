export default {
  extensionsToTreatAsEsm: [".ts", ".mts"],
  transform: {
    "^.+\\.(mc)?ts$": [
      "ts-jest",
      {
        diagnostics: false,
        useESM: true,
      },
    ],
  },
  testEnvironment: "@quramy/jest-prisma/environment",
  moduleNameMapper: {
    "^(\\.\\.?/.*)\\.js$": ["$1.ts", "$1.js"],
    "^(\\.\\.?/.*)\\.mjs$": ["$1.mts", "$1.mjs"],
    "^(\\.\\.?/.*)\\.cjs$": ["$1.cts", "$1.cjs"],
  },
  moduleFileExtensions: ["ts", "mts", "cts", "js", "mjs", "cjs", "json"],
};
