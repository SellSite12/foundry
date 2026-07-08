import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, parseBody, withErrorHandling } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { updateProfileSchema } from "@/lib/validation/auth";

export const PATCH = withErrorHandling(async (req: NextRequest) => {
  const user = await requireUser();
  const data = await parseBody(req, updateProfileSchema);

  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.image !== undefined && { image: data.image }),
    },
    select: { id: true, name: true, email: true, image: true },
  });

  return ok({ user: updated });
});
