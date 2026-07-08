import { NextRequest } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { ok, fail, parseBody, withErrorHandling } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";

const workspaceSchema = z.object({
  name: z.string().min(1),
});

export const GET = withErrorHandling(async () => {
  const user = await requireUser();

  const memberships = await db.workspaceMember.findMany({
    where: { userId: user.id },
    include: { workspace: { include: { stores: true, _count: { select: { members: true } } } } },
  });
  const owned = await db.workspace.findMany({
    where: { ownerId: user.id },
    include: { stores: true, _count: { select: { members: true } } },
  });

  return ok({ owned, memberships: memberships.map((m) => m.workspace) });
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser();
  const data = await parseBody(req, workspaceSchema);
  const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const existing = await db.workspace.findUnique({ where: { slug } });
  if (existing) return fail("Workspace slug already taken", 409);

  const workspace = await db.workspace.create({
    data: {
      ownerId: user.id,
      name: data.name,
      slug,
      members: { create: { userId: user.id, role: "OWNER" } },
    },
  });
  return ok({ workspace }, { status: 201 });
});
