# jest-prisma

[![github actions](https://github.com/Quramy/jest-prisma/workflows/build/badge.svg)](https://github.com/Quramy/jest-prisma/actions)
[![npm version](https://badge.fury.io/js/@quramy%2Fjest-prisma.svg)](https://badge.fury.io/js/@quramy%2Fjest-prisma)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/Quramy/jest-prisma/main/LICENSE.txt)

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

jest-prisma uses [Prisma interactive transaction feature](https://www.prisma.io/docs/concepts/components/prisma-client/transactions#interactive-transactions-in-preview). Edit your schema.prisma and turn `interactiveTransactions` on.

```gql
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["interactiveTransactions"]
}
```

#### Write tests

Global object `jestPrisma` is provided within jest-prisma environment. And Prisma client instance is available via `jestPrisma.client`

```ts
describe(UserService, () => {
  // jestPrisma.client works with transaction rolled-back automatically after each test case end.
  const prisma = jestPrisma.client;

  test("Add user", async () => {
    const createdUser = await prisma.user.create({
      data: {
        id: "001",
        name: "quramy",
      },
    });

    expect(
      await prisma.user.findFirst({
        where: {
          name: "quramy",
        },
      }),
    ).toStrictEqual(createdUser);
  });

  test("Count user", async () => {
    expect(await prisma.user.count()).toBe(0);
  });
});
```

## Configuration

You can pass some options using `testEnvironmentOptions`.

```js
/* jest.config.mjs */
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

## Tips

### Singleton

If your project uses singleton Prisma client instance, such as:

```ts
/* src/client.ts */
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
```

```ts
/* src/userService.ts */

import { prisma } from "./client.ts";

export function findUserById(id: string) {
  const result = await prisma.user.findUnique({
    where: { id },
  });
  return result;
}
```

You can replace the singleton instance to `jestPrisma.client` via `jest.mock`.

```js
/* setup-prisma.js */

jest.mock("./src/client", () => {
  return {
    prisma: jestPrisma.client,
  };
});
```

```js
/* jest.config.mjs */
export default {
  testEnvironment: "@quramy/jest-prisma/environment",
  setupFilesAfterEnv: ["<rootDir>/setup-prisma.js"],
};
```

```ts
import { prisma } from "./client";

import { findUserById } from "./userService";

describe("findUserById", () => {
  beforeEach(async () => {
    await prisma.user.create({
      data: {
        id: "test_user_id",
      },
    });
  });

  it("should return user", async () => {
    await findUserById("test_user_id");
    // assertion
  });
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
