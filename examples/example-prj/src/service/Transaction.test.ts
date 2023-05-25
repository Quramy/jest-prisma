/**
 *
 * @jest-environment-options { "verboseQuery": true }
 *
 */
import { Transaction } from "./Transaction";

describe(Transaction, () => {
  const prisma = jestPrisma.client;

  test("If interactive transactions fail, rollback is performed.", async () => {
    const service = new Transaction(prisma);
    await service.addUserWithInteractiveTransactionsFailed("yutaura");

    expect(
      await prisma.user.findFirst({
        where: {
          name: "yutaura",
        },
      }),
    ).toBeNull();
  });

  test("If interactive transactions succeed, they will be correctly applied.", async () => {
    const service = new Transaction(prisma);
    const user = await service.addUserWithInteractiveTransactionsSuccess("yutaura");

    expect(
      await prisma.user.findFirst({
        where: {
          name: "yutaura",
        },
      }),
    ).toStrictEqual(user);
  });

  test("If sequential operations fail, rollback is performed.", async () => {
    const service = new Transaction(prisma);
    await service.addUserWithSequentialOperationsFailed("yutaura");

    expect(
      await prisma.user.findFirst({
        where: {
          name: "yutaura",
        },
      }),
    ).toBeNull();
  });

  test("If sequential operations succeed, they will be correctly applied.", async () => {
    const service = new Transaction(prisma);
    const user = await service.addUserWithSequentialOperationsSuccess("yutaura");

    expect(
      await prisma.user.findFirst({
        where: {
          name: "yutaura",
        },
      }),
    ).toStrictEqual(user);
  });

  test("No users", async () => {
    expect(await prisma.user.count()).toBe(0);
  });
});
