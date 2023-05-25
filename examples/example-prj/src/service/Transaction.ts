import type { PrismaClient } from "@prisma/client";

let seq = 1;

export class Transaction {
  constructor(readonly prisma: PrismaClient) {}

  async addUserWithSequentialOperationsFailed(userName: string) {
    await this.prisma
      .$transaction([
        this.prisma.user.create({
          data: {
            id: `user-${seq++}`,
            name: userName,
          },
        }),
        // this operation will fail because user with id "not-exist" does not exist.
        this.prisma.user.update({
          where: {
            id: "not-exist",
          },
          data: {},
        }),
      ])
      .catch(() => null);
  }

  async addUserWithSequentialOperationsSuccess(userName: string) {
    const [user] = await this.prisma.$transaction([
      this.prisma.user.create({
        data: {
          id: `user-${seq++}`,
          name: userName,
        },
      }),
    ]);

    return user;
  }

  async addUserWithInteractiveTransactionsFailed(userName: string) {
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
      .catch(() => null);
  }

  async addUserWithInteractiveTransactionsSuccess(userName: string) {
    const user = await this.prisma.$transaction(async p => {
      return await p.user.create({
        data: {
          id: `user-${seq++}`,
          name: userName,
        },
      });
    });

    return user;
  }
}
