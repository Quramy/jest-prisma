import type { CustomPrismaClient } from "../prisma";
import { PostService } from "./PostService";

declare global {
  var jestPrisma: {
    client: CustomPrismaClient;
  };
}

describe(PostService, () => {
  const prisma = jestPrisma.client;

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
