/**
 *
 * @jest-environment-options { "verboseQuery": true }
 *
 */
import { PrismaClient } from "@prisma/client";

describe("Should include date type work arround", () => {
  /* NG */
  const prisma = jestPrisma.client;
  /* NG */
  //  const prisma = jestPrisma.originalClient;
  /* OK */
  // const prisma = new PrismaClient();

  beforeEach(async () => {
    await prisma.post.create({
      data: {
        id: "post0",
        title: "post",
        author: {
          create: {
            id: "user0",
            name: "quramy",
          },
        },
      },
    });
  });

  test("include api should work using date type condition", async () => {
    const user = await prisma.user.findFirst({
      where: {
        createdAt: {
          lt: new Date(),
          gte: new Date(new Date().getTime() - 1000 * 60 * 60 * 24),
        },
      },
      include: {
        posts: {
          where: {
            createdAt: {
              lt: new Date(),
              gte: new Date(new Date().getTime() - 1000 * 60 * 60 * 24),
            },
          },
        },
      },
    });

    expect(
      (await prisma.post.findFirst({
        where: {
          author: {
            createdAt: {
              lt: new Date(),
              gte: new Date(new Date().getTime() - 1000 * 60 * 60 * 24),
            },
          },
        },
        include: {
          author: {
            include: {
              posts: {
                where: {
                  createdAt: {
                    lt: new Date(),
                    gte: new Date(new Date().getTime() - 1000 * 60 * 60 * 24),
                  },
                },
              },
            },
          },
        },
      }))!.author,
    ).toStrictEqual(user);
  });
});
