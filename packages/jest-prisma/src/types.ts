import type { PrismaClient } from "@prisma/client";

export interface JestPrisma {
  readonly client: PrismaClient;
}
