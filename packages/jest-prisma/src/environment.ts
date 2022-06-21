import type { Event } from "jest-circus";
import type { JestEnvironmentConfig, EnvironmentContext } from "@jest/environment";
import NodeEnvironment from "jest-environment-node";

import { PrismaClient, Prisma } from "@prisma/client";

import type { JestPrisma } from "./types";

const _prisma = new PrismaClient();

export default class PrismaEnvironment extends NodeEnvironment {
  private prismaClientProxy!: PrismaClient;
  private triggerTransactionEnd: () => void = () => null;

  getClient() {
    return this.prismaClientProxy;
  }

  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context);
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
          return new Promise((_, reject) => (this.triggerTransactionEnd = reject));
        })
        .catch(() => true),
    );
  }

  private async endTransaction() {
    this.triggerTransactionEnd();
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
