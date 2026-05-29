import { PrismaClient } from "../generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const rawUrl = process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), "prisma", "dev.db")}`;
const filePath = rawUrl.startsWith("file:") ? rawUrl.slice(5) : rawUrl;
const DB_PATH = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: DB_PATH }),
  } as never);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
