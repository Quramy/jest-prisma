import type { JestPrismaEnvironmentOptions } from "./types";

export async function loadDefaultClient(options: JestPrismaEnvironmentOptions) {
  const { PrismaClient } = require("@prisma/client");
  const client: unknown = new PrismaClient({
    log: [{ level: "query", emit: "event" }],
    ...(options.databaseUrl && {
      datasources: {
        db: {
          url: options.databaseUrl,
        },
      },
    }),
  });
  return client;
}
