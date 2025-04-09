type PrismaTransactionIsolationLevel =
  | "ReadUncommitted"
  | "ReadCommitted"
  | "RepeatableRead"
  | "Snapshot"
  | "Serializable";

export interface PrismaClientLike {
  $connect: () => Promise<unknown>;
  $disconnect: () => Promise<unknown>;
  $transaction: (
    fn: (txClient: PrismaClientLike) => Promise<unknown>,
    Options?: { maxWait: number; timeout: number; isolationLevel?: PrismaTransactionIsolationLevel },
  ) => Promise<unknown>;
  $executeRawUnsafe: (query: string) => Promise<number>;
  $on: (event: "query", callbacck: (event: { readonly query: string; readonly params: string }) => unknown) => void;
}

export interface JestPrisma<T = PrismaClientLike> {
  /**
   *
   * Primsa Client Instance whose transaction are isolated for each test case.
   * And this transaction is rolled back automatically after each test case.
   *
   */
  readonly client: T;

  readonly originalClient: T;

  /**
   *
   * You can call this from setupAfterEnv script and set your customized PrismaClient instance.
   *
   */
  readonly initializeClient: (client: unknown) => void;
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
   * Sets the transaction isolation level. By default this is set to the value currently configured in your database.
   *
   * @link https://www.prisma.io/docs/orm/prisma-client/queries/transactions#supported-isolation-levels
   *
   */
  readonly isolationLevel?: PrismaTransactionIsolationLevel;

  /**
   *
   * Override the database connection URL.
   *
   * Default is the url set in the `DATABASE_URL` environment variable.
   *
   */
  readonly databaseUrl?: string;

  /**
   *
   * Override the path to the Prisma Client.
   *
   * If this is not set, defaults to `@prisma/client`.
   *
   */
  readonly clientPath?: string;
}
