import { ok, withErrorHandling } from "@/lib/api";
import { searchPhoton } from "@/lib/address/photon";

export const GET = withErrorHandling(async (req) => {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) {
    return ok({ suggestions: [] });
  }

  const suggestions = await searchPhoton(q);
  return ok({ suggestions });
});
