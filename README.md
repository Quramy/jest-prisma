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

jest-prisma uses [Prisma interactive transaction feature](https://www.prisma.io/docs/guides/performance-and-optimization/prisma-client-transactions-guide#interactive-transactions). Interactive transaction needs to be listed in `previewFeatures` if you use `@prisma/client` < 4.7 .

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

## Use customized `PrismaClient` instance

By default, jest-prisma instantiates and uses Prisma client instance from `@prisma/client`.

Sometimes you want to use customized (or extended) Prisma client instance, such as:

```ts
/* src/client.ts */
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient().$extends({
  client: {
    $myMethod: () => {
      /* ... */
    },
  },
});
```

You need configure jest-prisma by the following steps.

First, declare type of `global.jestPrisma` variable:

```ts
/* typeDefs/jest-prisma.d.ts */

import type { JestPrisma } from "@quramy/jest-prisma-core";
import type { prisma } from "../src/client";

declare global {
  var jestPrisma: JestPrisma<typeof prisma>;
}
```

And add the path of this declaration to your tsconfig.json:

```js
/* tsconfig.json */

{
  "compilerOptions": {
    "types": ["@types/jest"], // You don't need list "@quramy/jest-prisma"
  },
  "includes": ["typeDefs/jest-prisma.d.ts"],
}
```

Finally, configure jest-prisma environment using `setupFilesAfterEnv`:

```js
/* jest.config.mjs */

export default {
  testEnvironment: "@quramy/jest-prisma/environment",
  setupFilesAfterEnv: ["setupAfterEnv.ts"],
};
```

```js
/* setupAfterEnv.ts */

import { prisma } from "./src/client";

jestPrisma.initializeClient(prisma);
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

### DI Containers

If you're using DI containers such as [InversifyJS](https://github.com/inversify/InversifyJS) or [Awilix](https://github.com/jeffijoe/awilix) and wish to introduce jest-prisma, you can easily do that just by rebinding PrismaClient to a global `jestPrisma` instance provided by jest-prisma.

Here is an example below. Given that we have the following repository. Note that it is decorated by `@injectable` so will `prisma` will be inject as a constructor argument.

```ts
/* types.ts */
export const TYPES = {
  PrismaClient: Symbol.for("PrismaClient"),
  UserRepository: Symbol.for("UserRepository"),
};
```

```ts
/* user-repository.ts */
import { TYPES } from "./types";

interface IUserRepository {
  findAll(): Promise<User[]>;
  findById(): Promise<User[]>;
  save(): Promise<User[]>;
}

@injectable()
class UserRepositoryPrisma implements IUserRepository {
  constructor(
    @inject(TYPES.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async findAll() { .. }

  async findById() { .. }

  async save() { .. }
}
```

```ts
/* inversify.config.ts */
import { Container } from "inversify";
import { PrismaClient } from "prisma";

import { TYPES } from "./types";
import { UserRepositoryPrisma, IUserRepository } from "./user-repository";

const container = new Container();

container.bind(TYPES.PrismaClient).toConstantValue(new PrismaClient());

container.bind<IUserRepository>(TYPES.UserRepository).to(UserRepositoryPrisma);
```

In most cases, the setup above allows you to inject a pre-configured `PrismaClient` by associating the symbol to an actual instance like `bind(TYPES.PrismaClient).toConstantValue(new PrismaClient())` and then acquire the repository by `get(TYPES.UserRepository)`.

However, with jest-prisma, the global `jestPrisma.client` object is initialised for each unit tests so you have to make sure that you're binding the instance _after_ the initialisation.

Note that we're rebinding PrismaClient to the jest-prisma inside `beforeEach` phase. Any other phase including `beforeAll` or `setupFilesAfterEnv` may not work as you expect.

```ts
/* user-repository.spec.ts */
describe("UserRepository", () => {
  beforeEach(() => {
    container
      .rebind(TYPES.PrismaClient)
      .toConstantValue(jestPrisma.client);
  });

  it("creates a user" ,() => {
    constainer.get<IUserRepository>(TYPES.UserRepository);
    ...
  });
});
```

### Workaround for DateTime invocation error

If you encounter errors like the following:

```
Argument gte: Got invalid value {} on prisma.findFirstUser. Provided Json, expected DateTime.
```

It's because that Jest global `Date` is differ from JavaScript original `Date`(https://github.com/facebook/jest/issues/2549).

And this error can be work around by using [single context environment](https://www.npmjs.com/package/jest-environment-node-single-context):

```ts
/* myEnv.ts */
import type { Circus } from "@jest/types";
import type { JestEnvironmentConfig, EnvironmentContext } from "@jest/environment";

import { PrismaEnvironmentDelegate } from "@quramy/jest-prisma-core";
import Environment from "jest-environment-node-single-context";

export default class PrismaEnvironment extends Environment {
  private readonly delegate: PrismaEnvironmentDelegate;

  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context);
    this.delegate = new PrismaEnvironmentDelegate(config, context);
  }

  async setup() {
    const jestPrisma = await this.delegate.preSetup();
    await super.setup();
    this.global.jestPrisma = jestPrisma;
  }

  handleTestEvent(event: Circus.Event) {
    return this.delegate.handleTestEvent(event);
  }

  async teardown() {
    await Promise.all([super.teardown(), this.delegate.teardown()]);
  }
}
```

```js
/* jest.config.mjs */

export default {
  testEnvironment: "myEnv.ts",
};
```

Caveat: This work around might me affect your test cases using Jest fake timer features.

See also https://github.com/Quramy/jest-prisma/issues/56.

### Transaction Rollback

If you are using [$transaction callbacks in Prisma with the feature to roll back in case of an error](https://www.prisma.io/docs/concepts/components/prisma-client/transactions#:~:text=If%20your%20application%20encounters%20an%20error%20along%20the%20way%2C%20the%20async%20function%20will%20throw%20an%20exception%20and%20automatically%20rollback%20the%20transaction.), that's ok too. :D

Set `enableExperimentalRollbackInTransaction` in testEnvironmentOptions to `true`. This option allows nested transaction.

```js
/* jest.config.mjs */
export default {
  testEnvironment: "@quramy/jest-prisma/environment",
  testEnvironmentOptions: {
    enableExperimentalRollbackInTransaction: true, // <- add this
  },
};
```

Then, jest-prisma reproduces them in tests

```ts
const someTransaction = async prisma => {
  await prisma.$transaction(async p => {
    await p.user.create({
      data: {
        // ...
      },
    });

    throw new Error("Something failed. Affected changes will be rollback.");
  });
};

it("test", async () => {
  const prisma = jestPrisma.client;

  const before = await prisma.user.aggregate({ _count: true });
  expect(before._count).toBe(0);

  await someTransaction(prisma);

  const after = await prisma.user.aggregate({ _count: true });
  expect(after._count).toBe(0); // <- this will be 0
});
```

> [!TIP]
> The nested transaction is used to suppress PostgreSQL's `current transaction is aborted commands ignored until end of transaction block` error. See https://github.com/Quramy/jest-prisma/issues/141 if you want more details.

Internally, SAVEPOINT, which is formulated in the Standard SQL, is used.

Unfortunately, however, MongoDB does not support partial rollbacks within a Transaction using SAVEPOINT, so MongoDB is not able to reproduce rollbacks. In this case, do not set `enableExperimentalRollbackInTransaction` to true.

## References

### `global.jestPrisma`

```ts
export interface JestPrisma<T = PrismaClientLike> {
  /**
   *
   * Primsa Client Instance whose transaction are isolated for each test case.
   * And this transaction is rolled back automatically after each test case.
   *
   */
  readonly client: T;

  /**
   *
   * You can call this from setupAfterEnv script and set your customized PrismaClient instance.
   *
   */
  readonly initializeClient: (client: unknown) => void;
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
   * If set to true, it will reproduce the rollback behavior when an error occurs at the point where the transaction is used.
   *
   * In particular, if you are using MongoDB as the Database connector, you must not set it to true.
   *
   */
  readonly enableExperimentalRollbackInTransaction?: boolean;

  /**
   *
   * Display SQL queries in test cases to STDOUT.
   *
   */
  readonly verboseQuery?: boolean;

  /**
   *
   * The maximum amount of time the Prisma Client will wait to acquire a transaction from the database.
   *
   * The default value is 5 seconds.
   *
   */
  readonly maxWait?: number;

  /**
   *
   * The maximum amount of time the interactive transaction can run before being canceled and rolled back.
   *
   * The default value is 5 seconds.
   *
   */
  readonly timeout?: number;

  /**
   *
   * Sets the transaction isolation level. By default this is set to the value currently configured in your database.
   *
   * @link https://www.prisma.io/docs/orm/prisma-client/queries/transactions#transaction-isolation-level
   *
   */
  readonly isolationLevel?: Prisma.TransactionIsolationLevel;

  /**
   *
   * Override the database connection URL.
   *
   * Useful if you have a separate database for testing.
   *
   */
  readonly databaseUrl?: string;
}
```

## License

MIT
