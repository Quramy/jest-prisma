import type { JestPrisma } from "./types";

declare global {
  var jestPrisma: JestPrisma;
}
