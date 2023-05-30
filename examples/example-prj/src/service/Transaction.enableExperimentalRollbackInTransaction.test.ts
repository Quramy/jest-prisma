/**
 *
 * @jest-environment-options { "verboseQuery": true, "disableReproduceTransactionRollback": true }
 *
 */
import { Transaction } from "./Transaction";

describe(Transaction, () => {
  const prisma = jestPrisma.client;

  test("If interactive transactions fail, rollback will not occur.", async () => {
    const service = new Transaction(prisma);
    const user = await service.addUserWithInteractiveTransactionsFailed("yutaura");

    expect(
      await prisma.user.findFirst({
        where: {
          name: "yutaura",
        },
      }),
    ).toEqual(user);
  });

  test("If sequential operations fail, rollback will not occur.", async () => {
    const service = new Transaction(prisma);
    const user = await service.addUserWithSequentialOperationsFailed("yutaura");

    expect(
      await prisma.user.findFirst({
        where: {
          name: "yutaura",
        },
      }),
    ).toEqual(user);
  });

  test("No users", async () => {
    expect(await prisma.user.count()).toBe(0);
  });
});
