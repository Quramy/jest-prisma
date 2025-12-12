import { PrismaClient as GeneratedPrismaClient } from "./__generated__/prisma-client/client";

export const prisma = new GeneratedPrismaClient().$extends({
  client: {
    $myMethod: () => "my method",
  },
});

export type PrismaClient = typeof prisma;
