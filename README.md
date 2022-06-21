# jest-prisma

Jest environment for Prisma integrated testing.
You can run each test case in isolated transaction which is rolled back automatically.

## How to use

#### Install

```sh
$ npm i @quramy/jest-prisma -D
```

#### Configure Jest

```js
/* jest.config.mjs */
export default {
  // ... Your jest configuration

  testEnvironment: "@quramy/jest-prisma/environment",
};
```

#### Configure TypeScript

```js
/* tsconfig.json */

{
  "compilerOptions": {
    "types": ["@types/jest", "@quramy/jest-prisma"],
  }
}
```

#### Configure Prisma

jest-prisma uses [Prisma interactive transaction feature](https://www.prisma.io/docs/concepts/components/prisma-client/transactions#interactive-transactions-in-preview). Edit your schema.prisma and tern `interactiveTransactions` on.

```gql
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["interactiveTransactions"]
}
```

#### Write tests

Global object `jestPrisma` is provided within jest-prisma environment. And Prisma client instance is available via `jestPrisma.client`

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

You can pass some options using `testEnvironmentOptions`.

```js
/* jest.confit.mjs */
export default {
  testEnvironment: "@quramy/jest-prisma/environment",
  testEnvironmentOptions: {
    verboseQuery: true,
  },
};
```

Alternatively, you can use `@jest-environment-options` pragma in your test file:

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
