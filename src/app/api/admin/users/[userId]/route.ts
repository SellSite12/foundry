import { NextRequest } from "next/server";

import { ApiError, ok, parseBody, withErrorHandling } from "@/lib/api";
import { requireAdmin } from "@/lib/admin/access";
import { db } from "@/lib/db";
import { adminUserPatchSchema } from "@/lib/validation/templates";

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const admin = await requireAdmin();
  const { userId } = await params;
  const data = await parseBody(req, adminUserPatchSchema);

  if (userId === admin.id && data.role === "USER") {
    throw new ApiError("You cannot demote your own admin account", 400);
  }
  if (userId === admin.id && data.status === "SUSPENDED") {
    throw new ApiError("You cannot suspend your own account", 400);
  }

  const user = await db.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
    },
  });

  if (data.status === "SUSPENDED") {
    await db.session.deleteMany({ where: { userId } });
  }

  return ok({ user });
});
