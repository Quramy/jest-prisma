/**
 *
 * @jest-environment-options { "verboseQuery": true }
 *
 */
import "@quramy/jest-prisma";

import type { PrismaClient } from "@prisma/client";
import { PostService } from "./PostService";

describe(PostService, () => {
  let prisma: PrismaClient;
  beforeEach(() => (prisma = jestPrisma.client));

  describe("getPosts", () => {
    describe("when posts data exsits", () => {
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

      test("getPosts returns 1 post", async () => {
        const service = new PostService(prisma);
        const posts = await service.getPosts();
        expect(posts.length).toBe(1);
      });
    });
  });
});
