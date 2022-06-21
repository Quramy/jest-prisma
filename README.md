# jest-prisma

Jest environment for Prisma integrated testing.
You can run each test case in isolated transaction which is rolled back automatically.

## How to use

```sh
$ npm i @quramy/jest-prisma -D
```

```js
/* jest.config.js */
module.exports = {
  // ... Your jest configuration

  testEnvironment: "@quramy/jest-prisma/environment",
};
```

jest-prisma uses [Prisma interactive transaction feature](https://www.prisma.io/docs/concepts/components/prisma-client/transactions#interactive-transactions-in-preview). Edit your schema.prisma and tern `interactiveTransactions` on.

```gql
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["interactiveTransactions"]
}
```

```ts
import { PrismaClient } from "@prisma/client";
import { UserService } from "./UserService";

describe(UserService, () => {
  let prisma: PrismaClient;
  beforeEach(() => {
    // jestPrisma.client works with transaction rolled-back automatically after each test case end.
    prisma = jestPrisma.client;
  });

  test("Add user", async () => {
    const service = new UserService(prisma);

    // `prisma.user.create` is executed in this service
    const createdUser = await service.addUser("quramy");

    expect(
      await prisma.user.findFirst({
        where: {
          name: "quramy",
        },
      }),
    ).toStrictEqual(createdUser);
  });
});
```

## Configuration

```js
/* jest.confit.js */
module.exports = {
  testEnvironment: "@quramy/jest-prisma/environment",
  testEnvironmentOptions: {
    verboseQuery: true,
  },
};
```

Alternatively, you can use `@jest-environment-options` pragma:

```js
/**
 *
 * @jest-environment-options: { "verboseQuery": true }
 *
 */
test("it should execute prisma client", () => {
  /* .... */
});
```

## References

### `global.jestPrisma`

```ts
export interface JestPrisma {
  /**
   *
   * Primsa Client Instance whose transaction are isolated for each test case.
   * And this transaction is rolled back automatically after each test case.
   *
   */
  readonly client: PrismaClient;
}
```

### Environment options

```ts
export interface JestPrismaEnvironmentOptions {
  /**
   *
   * If set true, each transaction is not rolled back but committed.
   *
   */
  readonly disableRollback?: boolean;

  /**
   *
   * Display SQL queries in test cases to STDOUT.
   *
   */
  readonly verboseQuery?: boolean;
}
```

## License

MIT
