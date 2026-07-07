import { NextRequest } from "next/server";

import { db } from "@/lib/db";
import { ok, withErrorHandling } from "@/lib/api";
import { authenticateBearer, logApiRequest } from "@/lib/api/bearer";
import { parsePagination, paginated } from "@/lib/api/v1";

export const GET = withErrorHandling(async (req: NextRequest, { params }) => {
  const start = Date.now();
  const { storeId } = await params;
  const auth = await authenticateBearer(req, storeId);
  const p = parsePagination(req);

  const [members, owner] = await Promise.all([
    db.teamMember.findMany({
      where: { storeId: auth.storeId, status: "ACTIVE" },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    db.store.findUnique({
      where: { id: auth.storeId },
      select: { owner: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  const users = [
    ...(owner
      ? [{ id: owner.owner.id, name: owner.owner.name, email: owner.owner.email, role: "OWNER" }]
      : []),
    ...members
      .filter((m) => m.user)
      .map((m) => ({
        id: m.user!.id,
        name: m.user!.name,
        email: m.user!.email,
        role: m.role,
      })),
  ];

  const slice = users.slice(p.skip, p.skip + p.limit);
  const res = ok(paginated(slice, users.length, p));
  void logApiRequest({
    storeId,
    apiKeyId: auth.apiKeyId,
    method: "GET",
    path: req.nextUrl.pathname,
    statusCode: 200,
    durationMs: Date.now() - start,
  });
  return res;
});
