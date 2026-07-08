import type { Store } from "@prisma/client";

import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { requireUser, type SessionUser } from "@/lib/auth/session";
import type { TeamRole } from "@/lib/constants";

export type StoreScope =
  | "products"
  | "orders"
  | "customers"
  | "inventory"
  | "analytics"
  | "marketing"
  | "media"
  | "reviews"
  | "inbox"
  | "team"
  | "settings"
  | "billing"
  | "developer"
  | "ai"
  | "integrations"
  | "audit"
  | "reports";

/** Scopes each role may access. OWNER/ADMIN get everything. */
const ROLE_SCOPES: Record<TeamRole, StoreScope[] | "all"> = {
  OWNER: "all",
  ADMIN: "all",
  MANAGER: [
    "products",
    "orders",
    "customers",
    "inventory",
    "analytics",
    "marketing",
    "media",
    "reviews",
    "inbox",
    "settings",
    "ai",
    "reports",
  ],
  SUPPORT: ["orders", "customers", "reviews", "inbox", "ai"],
  WAREHOUSE: ["orders", "inventory", "products", "reports"],
};

export type StoreAccess = {
  store: Store;
  user: SessionUser;
  role: TeamRole;
};

export function roleAllows(role: TeamRole, scope: StoreScope, permissions?: string | null): boolean {
  // Custom permission overrides: JSON like {"marketing": true, "orders": false}
  if (permissions) {
    try {
      const custom = JSON.parse(permissions) as Record<string, boolean>;
      if (scope in custom) return custom[scope];
    } catch {
      // malformed overrides fall back to role defaults
    }
  }
  const scopes = ROLE_SCOPES[role];
  return scopes === "all" || scopes.includes(scope);
}

/**
 * Resolves the current user's access to a store. Throws 404 for stores the
 * user cannot see at all (no information leak) and 403 when the store is
 * visible but the scope is not permitted for their role.
 */
export async function requireStoreAccess(
  storeId: string,
  scope?: StoreScope
): Promise<StoreAccess> {
  const user = await requireUser();

  const store = await db.store.findUnique({ where: { id: storeId } });
  if (!store) throw new ApiError("Store not found", 404);

  let role: TeamRole | null = null;
  let permissions: string | null = null;

  if (store.ownerId === user.id) {
    role = "OWNER";
  } else {
    const membership = await db.teamMember.findFirst({
      where: { storeId, userId: user.id, status: "ACTIVE" },
    });
    if (membership) {
      role = membership.role as TeamRole;
      permissions = membership.permissions;
    }
  }

  if (!role) throw new ApiError("Store not found", 404);

  if (scope && !roleAllows(role, scope, permissions)) {
    throw new ApiError("You don't have permission to access this area", 403);
  }

  return { store, user, role };
}

/**
 * Page-friendly variant: returns null instead of throwing, so server
 * components can call notFound()/redirect().
 */
export async function getStoreAccess(
  storeId: string,
  scope?: StoreScope
): Promise<StoreAccess | null> {
  try {
    return await requireStoreAccess(storeId, scope);
  } catch {
    return null;
  }
}

/** All stores the user owns or belongs to (for the store switcher). */
export async function getUserStores(userId: string) {
  const [owned, memberships] = await Promise.all([
    db.store.findMany({ where: { ownerId: userId }, orderBy: { createdAt: "asc" } }),
    db.teamMember.findMany({
      where: { userId, status: "ACTIVE" },
      include: { store: true },
    }),
  ]);
  const memberStores = memberships
    .map((m) => m.store)
    .filter((s) => s.ownerId !== userId);
  return [...owned, ...memberStores];
}

/** Notifies the store owner (and skips the actor if they are the owner). */
export async function notifyStoreOwner(
  store: { id: string; ownerId: string },
  input: { type?: string; title: string; body?: string; href?: string },
  actorUserId?: string
): Promise<void> {
  if (actorUserId === store.ownerId) return;
  await db.notification.create({
    data: {
      userId: store.ownerId,
      type: input.type ?? "INFO",
      title: input.title,
      body: input.body,
      href: input.href,
    },
  });
}
