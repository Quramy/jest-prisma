import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

export const prisma = client.$extends({
  model: {
    post: {
      async findBy(id: string) {
        return await client.post.findUniqueOrThrow({ where: { id } });
      },
    },
  },
});

export type CustomPrismaClient = typeof prisma;
