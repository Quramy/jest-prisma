import { CustomPrismaClient } from "../prisma";

export class PostService {
  constructor(readonly prisma: CustomPrismaClient) {}

  async getPosts() {
    const result = await this.prisma.post.findMany({
      take: 3,
    });
    return result;
  }
}
