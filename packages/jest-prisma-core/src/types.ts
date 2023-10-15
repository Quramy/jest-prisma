import type { PrismaClient } from "@prisma/client";

export interface JestPrisma {
  /**
   *
   * Primsa Client Instance whose transaction are isolated for each test case.
   * And this transaction is rolled back automatically after each test case.
   *
   */
  readonly client: PrismaClient;

  readonly originalClient: PrismaClient;

  readonly originalModule: typeof import("@prisma/client");
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
   * Override the database connection URL.
   *
   * Default is the url set in the `DATABASE_URL` environment variable.
   *
   */
  readonly databaseUrl?: string;
}
