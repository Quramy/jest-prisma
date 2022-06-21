/**
 *
 * @jest-environment-options { "verboseQuery": true }
 *
 */
import "@quramy/jest-prisma";

import { PrismaClient } from "@prisma/client";
import { UserService } from "./UserService";

describe(UserService, () => {
  let prisma: PrismaClient;
  beforeEach(() => (prisma = jestPrisma.client));

  test("Add user", async () => {
    const service = new UserService(prisma);
    const createdUser = await service.addUser("quramy");

    expect(
      await prisma.user.findFirst({
        where: {
          name: "quramy",
        },
      }),
    ).toStrictEqual(createdUser);
  });

  test("No users", async () => {
    expect((await prisma.user.findMany()).length).toBe(0);
  });
});
