describe("Prisma Client", () => {
  const prisma = jestPrisma.client;

  test("with client extension", async () => {
    expect(prisma.$myMethod()).toBe("my method");
    await expect(prisma.user.count()).resolves.toBe(0);
  });
});
