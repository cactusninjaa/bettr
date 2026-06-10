import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function buildClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  if (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://")) {
    const adapter = new PrismaNeon({ connectionString: dbUrl });
    return new PrismaClient({ adapter });
  }
  const file = dbUrl.replace(/^file:/, "");
  const adapter = new PrismaBetterSqlite3({ url: file });
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? buildClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
