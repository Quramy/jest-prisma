describe("extension", () => {
  it("should run a basic test", () => {
    expect(jestPrisma.client.$myMethod()).toBe("my method");
  });
});
