describe("warning message", () => {
  let failed = false;

  beforeAll(async () => {
    try {
      jestPrisma.client.user.create({
        data: {
          id: "testuser",
          name: "testuser",
        },
      });
    } catch (e) {
      failed = true;
    }
  });

  test("beforeAll callback is failed", () => {
    expect(failed).toBeTruthy();
  });
});
