export type Category = "people" | "assets" | "accounts" | "documents" | "tasks";
export type Level = "none" | "view" | "edit";

export const CATEGORIES: { key: Category; label: string }[] = [
  { key: "people", label: "People" },
  { key: "assets", label: "Assets" },
  { key: "accounts", label: "Accounts" },
  { key: "documents", label: "Documents" },
  { key: "tasks", label: "Tasks" },
];

type PermissionUser = {
  isAdmin: boolean;
  permissions: { category: string; level: string }[];
};

// No MemberPermission row for a category means "edit" - the default until
// an admin restricts it. Admins always get full access regardless of rows.
export function getLevel(user: PermissionUser, category: Category): Level {
  if (user.isAdmin) return "edit";
  const row = user.permissions.find((p) => p.category === category);
  return (row?.level as Level) ?? "edit";
}

export function canView(user: PermissionUser, category: Category): boolean {
  return getLevel(user, category) !== "none";
}

export function canEdit(user: PermissionUser, category: Category): boolean {
  return getLevel(user, category) === "edit";
}

export class ForbiddenError extends Error {
  constructor(message = "You don't have permission to do that.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function requireEdit(user: PermissionUser, category: Category) {
  if (!canEdit(user, category)) throw new ForbiddenError();
}

export function requireView(user: PermissionUser, category: Category) {
  if (!canView(user, category)) throw new ForbiddenError();
}

export function requireAdmin(user: { isAdmin: boolean }) {
  if (!user.isAdmin) throw new ForbiddenError("Only admins can do that.");
}
