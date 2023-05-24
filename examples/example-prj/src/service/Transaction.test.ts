/**
 *
 * @jest-environment-options { "verboseQuery": true }
 *
 */
import { Transaction } from "./Transaction";

describe(Transaction, () => {
  const prisma = jestPrisma.client;

  test("Add user", async () => {
    const service = new Transaction(prisma);
    await service.addUserWithTransactionFailed("yutaura");

    expect(
      await prisma.user.findFirst({
        where: {
          name: "yutaura",
        },
      }),
    ).toStrictEqual(null);
  });

  test("No users", async () => {
    expect(await prisma.user.count()).toBe(0);
  });
});
