import { prisma } from "@/lib/prisma";
import type { Category } from "@/lib/permissions";

type AuditAction =
  | "created"
  | "updated"
  | "deleted"
  | "member_joined"
  | "member_admin_changed"
  | "member_permission_changed"
  | "invite_created"
  | "invite_revoked";

type AuditCategory = Category | "household" | "member";

export async function logAudit(params: {
  householdId: string;
  userId: string;
  userName: string;
  action: AuditAction;
  category: AuditCategory;
  entityLabel: string;
  detail?: string;
}) {
  await prisma.auditLog.create({
    data: {
      householdId: params.householdId,
      userId: params.userId,
      userNameAtTime: params.userName,
      action: params.action,
      category: params.category,
      entityLabel: params.entityLabel,
      detail: params.detail ?? null,
    },
  });
}
