import type { PrismaClient } from "@prisma/client";

let seq = 1;

export class UserService {
  constructor(readonly prisma: PrismaClient) {}

  async addUser(userName: string) {
    const createdUser = await this.prisma.user.create({
      data: {
        id: `user-${seq++}`,
        name: userName,
      },
    });
    return createdUser;
  }
}
