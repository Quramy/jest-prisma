import type { PrismaClient } from "@prisma/client";

export type JestPrismaEnvironmentConfig = {
  globalConfig?: {
    rootDir?: string;
  };
  projectConfig: {
    testEnvironmentOptions: JestPrismaEnvironmentOptions;
  };
};

export type JestPrismaEnvironmentContext = {
  testPath?: string;
};

export interface JestPrisma {
  /**
   *
   * Primsa Client Instance whose transaction are isolated for each test case.
   * And this transaction is rolled back automatically after each test case.
   *
   */
  readonly client: PrismaClient;

  readonly originalClient: PrismaClient;
}

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
   * Override the database connection URL.
   *
   * Default is the url set in the `DATABASE_URL` environment variable.
   *
   */
  readonly databaseUrl?: string;
}

interface PrismaClientLike {
  $connect: () => PromiseLike<unknown>;
  $disconnect: () => PromiseLike<unknown>;
  $transaction: (...args: any[]) => PromiseLike<unknown>;
}

export interface PreSetupOptions {
  experimentalCustomClient?: PrismaClientLike;
}
