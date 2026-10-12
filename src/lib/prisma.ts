import { PrismaClient } from "@prisma/client";

// Models with a `deletedAt` column (see prisma/schema.prisma) - soft-deleted
// instead of actually removed, so a misclick is recoverable for 30 days
// (see /lib/actions/trash.ts and the purge cron).
const SOFT_DELETE_MODELS = new Set(["Person", "Asset", "Account", "Document", "Task"]);
const READ_OPS = new Set(["findFirst", "findFirstOrThrow", "findMany", "findUnique", "findUniqueOrThrow", "count", "aggregate", "groupBy"]);

// Every read on these models is scoped to non-deleted rows by default - a
// caller that explicitly sets `where.deletedAt` (the trash page, the purge
// job, a restore lookup) opts out of the auto-filter instead of fighting it.
// This is deliberately a query-level filter, not a delete-level rewrite:
// deletePerson/deleteAsset/etc. still call `.update({ deletedAt: ... })`
// explicitly, so "this is a soft delete" stays visible at the call site.
function withSoftDeleteFilter(client: PrismaClient) {
  return client.$extends({
    name: "soft-delete-read-filter",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (model && SOFT_DELETE_MODELS.has(model) && READ_OPS.has(operation)) {
            const where = (args as { where?: Record<string, unknown> }).where ?? {};
            if (where.deletedAt === undefined) {
              (args as { where?: Record<string, unknown> }).where = { ...where, deletedAt: null };
            }
          }
          return query(args);
        },
      },
    },
  });
}

type ExtendedPrismaClient = ReturnType<typeof withSoftDeleteFilter>;

const globalForPrisma = globalThis as unknown as { prisma?: ExtendedPrismaClient };

export const prisma = globalForPrisma.prisma ?? withSoftDeleteFilter(new PrismaClient());

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
