import type { Circus } from "@jest/types";

import chalk from "chalk";

import type { JestEnvironment } from "@jest/environment";

import { getPrismaClient } from "@prisma/client/runtime";
import { PrismaClient as PrismaClientKlass } from "@prisma/client";

import type {
  JestPrisma,
  JestPrismaEnvironmentOptions,
  JestPrismaEnvironmentConfig,
  JestPrismaEnvironmentContext,
  PreSetupOptions,
} from "./types";
import { loadDefaultClient } from "./loadDefaultClient";

type PartialEnvironment = Pick<JestEnvironment<unknown>, "handleTestEvent" | "teardown">;

type PrismaClient = ReturnType<typeof getPrismaClient> extends new () => infer T ? T : never;
type TransactionClient = PrismaClient;
type QueryEvent = {
  readonly query: string;
};

const DEFAULT_MAX_WAIT = 5_000;

function isPrismaClient(x: unknown): x is PrismaClient {
  if (typeof x !== "object" || x == null) return false;
  if (!("$transaction" in x) || typeof x["$transaction"] !== "function") return false;
  if (!("$connect" in x) || typeof x["$connect"] !== "function") return false;
  if (!("$disconnect" in x) || typeof x["$disconnect"] !== "function") return false;
  return true;
}

export class PrismaEnvironmentDelegate implements PartialEnvironment {
  private prismaClientProxy!: PrismaClient;
  private originalClient!: PrismaClient;
  private triggerTransactionEnd: () => void = () => null;
  private readonly options: JestPrismaEnvironmentOptions;
  private readonly testPath: string;
  private logBuffer: QueryEvent[] | undefined = undefined;

  constructor(config: JestPrismaEnvironmentConfig, context: JestPrismaEnvironmentContext) {
    this.options = config.projectConfig.testEnvironmentOptions as JestPrismaEnvironmentOptions;
    if (config.globalConfig?.rootDir && context.testPath) {
      this.testPath = context.testPath.replace(config.globalConfig.rootDir, "").slice(1);
    } else {
      this.testPath = "";
    }
  }

  async preSetup({ experimentalCustomClient }: PreSetupOptions = {}) {
    const originalClient = new PrismaClientKlass({
      log: [{ level: "query", emit: "event" }],
      ...(this.options.databaseUrl && {
        datasources: {
          db: {
            url: this.options.databaseUrl,
          },
        },
      }),
    }) as unknown as PrismaClient;
    if (experimentalCustomClient) {
      const unknownClient: unknown = experimentalCustomClient;
      if (!isPrismaClient(unknownClient)) {
        throw new Error("custmClient is not Prisma client");
      }
      this.originalClient = unknownClient;
    } else {
      this.originalClient = (await loadDefaultClient(this.options)) as PrismaClient;
    }

    this.originalClient.$on("query", (event: QueryEvent) => {
      this.logBuffer?.push(event);
    });

    this.originalClient = originalClient;

    await this.originalClient.$connect();
    const hasInteractiveTransaction = await this.checkInteractiveTransaction();
    if (!hasInteractiveTransaction) {
      throw new Error(`jest-prisma needs "interactiveTransactions" preview feature.`);
    }
    const jestPrisma: JestPrisma = {
      client: new Proxy<PrismaClient>({} as never, {
        get: (_, name: keyof PrismaClient) => this.prismaClientProxy[name],
      }) as any,
      originalClient: this.originalClient as any,
    };
    return jestPrisma;
  }

  handleTestEvent(event: Circus.Event) {
    if (event.name === "test_start") {
      return this.beginTransaction();
    } else if (event.name === "test_done" || event.name === "test_skip") {
      return this.endTransaction();
    } else if (event.name === "test_fn_start") {
      this.logBuffer = [];
    } else if (event.name === "test_fn_success" || event.name === "test_fn_failure") {
      this.dumpQueryLog(event.test);
      this.logBuffer = undefined;
    }
  }

  async teardown() {
    await this.originalClient.$disconnect();
  }

  private async checkInteractiveTransaction() {
    const checker: any = () => Promise.resolve(null);
    try {
      await this.originalClient.$transaction(checker);
      return true;
    } catch {
      return false;
    }
  }

  private async beginTransaction() {
    return new Promise<void>(resolve =>
      this.originalClient
        .$transaction(
          (transactionClient: TransactionClient) => {
            this.prismaClientProxy = createProxy(transactionClient, this.originalClient);
            resolve();
            return new Promise(
              (resolve, reject) => (this.triggerTransactionEnd = this.options.disableRollback ? resolve : reject),
            );
          },
          {
            maxWait: this.options.maxWait ?? DEFAULT_MAX_WAIT,
          },
        )
        .catch(() => true),
    );
  }

  private async endTransaction() {
    this.triggerTransactionEnd();
  }

  private dumpQueryLog(test: Circus.TestEntry) {
    if (this.options.verboseQuery && this.logBuffer) {
      let parentBlock: Circus.DescribeBlock | undefined | null = test.parent;
      const nameFragments: string[] = [test.name];
      while (!!parentBlock) {
        nameFragments.push(parentBlock.name);
        parentBlock = parentBlock.parent;
      }
      const breadcrumb = [this.testPath, ...nameFragments.reverse().slice(1)].join(" > ");
      console.log(chalk.blue.bold.inverse(" QUERY ") + " " + chalk.gray(breadcrumb));
      for (const event of this.logBuffer) {
        console.log(`${chalk.blue("  jest-prisma:query")} ${event.query}`);
      }
    }
  }
}

function fakeInnerTransactionFactory(parentTxClient: TransactionClient) {
  const fakeTransactionMethod = async (
    arg: PromiseLike<unknown>[] | ((client: TransactionClient) => Promise<unknown>),
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

function createProxy(txClient: TransactionClient, originalClient: any) {
  const boundFakeTransactionMethod = fakeInnerTransactionFactory(txClient);
  return new Proxy(txClient, {
    get: (target, name) => {
      const delegate = target[name as keyof TransactionClient];
      if (delegate) return delegate;
      if (name === "$transaction") {
        return boundFakeTransactionMethod;
      }
      if (originalClient[name as keyof PrismaClient]) {
        throw new Error(`Unsupported property: ${name.toString()}`);
      }
    },
  }) as PrismaClient;
}
