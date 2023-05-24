import type { PrismaClient } from "@prisma/client";

let seq = 1;

export class Transaction {
  constructor(readonly prisma: PrismaClient) {}

  async addUserWithTransactionFailed(userName: string) {
    await this.prisma
      .$transaction(async p => {
        await p.user.create({
          data: {
            id: `user-${seq++}`,
            name: userName,
          },
        });

        throw new Error("transaction failed.");
      })
      .catch(console.error);
  }
}
