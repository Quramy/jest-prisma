import { jest } from "@jest/globals";

jest.unstable_mockModule("../client.js", () => {
  return {
    prisma: jestPrisma.client,
  };
});

const { prisma } = await import("../client.js");

describe("mocked singleton", () => {
  test("works as client", async () => {
    await prisma.user.create({
      data: {
        id: "001",
        name: "quramy",
      },
    });
  });

  test("transaction isolated", async () => {
    expect(await prisma.user.count()).toBe(0);
  });
});
