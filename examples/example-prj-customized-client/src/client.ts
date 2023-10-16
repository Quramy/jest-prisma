import { PrismaClient as PrismaConstructor } from "@prisma/client";

export const prisma = new PrismaConstructor({
  log: [{ level: "query", emit: "event" }],
}).$extends({
  client: {
    $myMethod: () => "my method",
  },
});

export type PrismaClient = typeof prisma;
