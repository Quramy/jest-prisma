# @quramy/jest-prisma-core

Utility class to build Jest environment for Prisma.

## Usage

```ts
import type { Circus } from "@jest/types";
import type { JestEnvironmentConfig, EnvironmentContext } from "@jest/environment";
import { PrismaEnvironmentDelegate } from "@quramy/jest-prisma-core";

import Environment from "your-jest-environment";

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

## LICENSE

MIT
