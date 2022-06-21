import type { Event } from "jest-circus";
import type { Circus } from "@jest/types";
import type { JestEnvironmentConfig, EnvironmentContext } from "@jest/environment";
import chalk from "chalk";
import NodeEnvironment from "jest-environment-node";

import { PrismaClient, Prisma } from "@prisma/client";

import type { JestPrisma, JestPrismaEnvironmentOptions } from "./types";

let logBuffer: Prisma.QueryEvent[] | undefined = undefined;

const _prisma = new PrismaClient({
  log: [{ level: "query", emit: "event" }],
});

_prisma.$on("query", event => {
  logBuffer?.push(event);
});

export default class PrismaEnvironment extends NodeEnvironment {
  private prismaClientProxy!: PrismaClient;
  private triggerTransactionEnd: () => void = () => null;
  private readonly options: JestPrismaEnvironmentOptions;
  private readonly testPath: string;

  getClient() {
    return this.prismaClientProxy;
  }

  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context);
    this.options = config.projectConfig.testEnvironmentOptions as JestPrismaEnvironmentOptions;
    this.testPath = context.testPath.replace(config.globalConfig.rootDir, "").slice(1);
  }

  async setup() {
    await super.setup();
    const getClient = this.getClient.bind(this);
    const jestPrisma: JestPrisma = {
      get client() {
        return getClient();
      },
    };
    this.global.jestPrisma = jestPrisma;
  }

  handleTestEvent(event: Event) {
    if (event.name === "test_start") {
      return this.beginTransaction();
    } else if (event.name === "test_done") {
      return this.endTransaction();
    } else if (event.name === "test_fn_start") {
      logBuffer = [];
    } else if (event.name === "test_fn_success" || event.name === "test_fn_failure") {
      this.dumpQueryLog(event.test);
      logBuffer = undefined;
    }
  }

  async teardown() {
    await super.teardown();
    await _prisma.$disconnect();
  }

  private async beginTransaction() {
    return new Promise<void>(resolve =>
      _prisma
        .$transaction(transactionClient => {
          this.prismaClientProxy = createProxy(transactionClient);
          resolve();
          return new Promise(
            (resolve, reject) => (this.triggerTransactionEnd = this.options.disableRollback ? resolve : reject),
          );
        })
        .catch(() => true),
    );
  }

  private async endTransaction() {
    this.triggerTransactionEnd();
  }

  private dumpQueryLog(test: Circus.TestEntry) {
    if (this.options.verboseQuery && logBuffer) {
      let parentBlock: Circus.DescribeBlock | undefined | null = test.parent;
      const nameFragments: string[] = [test.name];
      while (!!parentBlock) {
        nameFragments.push(parentBlock.name);
        parentBlock = parentBlock.parent;
      }
      const breadcrumb = [this.testPath, ...nameFragments.reverse().slice(1)].join(" > ");
      console.log(chalk.bgBlue.bold.black(" QUERY ") + " " + chalk.gray(breadcrumb));
      for (const event of logBuffer) {
        console.log(`${chalk.blue("  jest-prisma:query")} ${event.query}`);
      }
    }
  }
}

function fakeInnerTransactionFactory(parentTxClient: Prisma.TransactionClient) {
  const fakeTransactionMethod = async (
    arg: PromiseLike<unknown>[] | ((client: Prisma.TransactionClient) => Promise<unknown>),
  ) => {
    if (Array.isArray(arg)) {
      const results = [] as unknown[];
      for (const prismaPromise of arg) {
        const result = await prismaPromise;
        results.push(result);
      }
      return results;
    } else {
      return await arg(parentTxClient);
    }
  };
  return fakeTransactionMethod;
}

function createProxy(txClient: Prisma.TransactionClient) {
  const boundFakeTransactionMethod = fakeInnerTransactionFactory(txClient);
  return new Proxy(txClient, {
    get: (target, name) => {
      const delegate = target[name as keyof Prisma.TransactionClient];
      if (delegate) return delegate;
      if (name === "$transaction") {
        return boundFakeTransactionMethod;
      }
      if (_prisma[name as keyof PrismaClient]) {
        throw new Error(`Unsupported property: ${name.toString()}`);
      }
    },
  }) as PrismaClient;
}
