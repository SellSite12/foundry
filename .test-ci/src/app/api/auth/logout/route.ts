import { NextRequest } from "next/server";

import { ok, assertSameOrigin, withErrorHandling } from "@/lib/api";
import { destroySession } from "@/lib/auth/session";

export const POST = withErrorHandling(async (req: NextRequest) => {
  assertSameOrigin(req);
  await destroySession();
  return ok({ loggedOut: true });
});
