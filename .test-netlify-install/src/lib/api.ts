import { NextRequest, NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

import { UnauthorizedError } from "@/lib/auth/session";

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(
  message: string,
  status: number,
  fieldErrors?: Record<string, string>
): NextResponse {
  return NextResponse.json(
    { ok: false, error: message, fieldErrors },
    { status }
  );
}

/**
 * Parses and validates a JSON request body against a Zod schema.
 * Also enforces same-origin requests (CSRF defense-in-depth on top of
 * SameSite cookies).
 */
export async function parseBody<T>(
  req: NextRequest,
  schema: ZodType<T>
): Promise<T> {
  assertSameOrigin(req);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new ApiError("Invalid JSON body", 400);
  }
  return schema.parse(json);
}

export function assertSameOrigin(req: NextRequest): void {
  const origin = req.headers.get("origin");
  if (!origin) return; // same-origin fetches may omit the header
  const host = req.headers.get("host");
  try {
    if (new URL(origin).host !== host) {
      throw new ApiError("Cross-origin request rejected", 403);
    }
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError("Cross-origin request rejected", 403);
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type RouteContext = { params: Promise<Record<string, string>> };

/**
 * Wraps a route handler with uniform error handling: Zod validation errors
 * become 400s with field-level messages, auth errors become 401s, and
 * unexpected errors are logged and returned as opaque 500s.
 * Passes through the Next.js route context (dynamic params).
 */
export function withErrorHandling(
  handler: (req: NextRequest, ctx: RouteContext) => Promise<NextResponse>
): (req: NextRequest, ctx: RouteContext) => Promise<NextResponse> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of error.issues) {
          const key = issue.path.join(".") || "form";
          if (!fieldErrors[key]) fieldErrors[key] = issue.message;
        }
        return fail("Validation failed", 400, fieldErrors);
      }
      if (error instanceof UnauthorizedError) {
        return fail("Not authenticated", 401);
      }
      if (error instanceof ApiError) {
        return fail(error.message, error.status);
      }
      console.error("[api] Unhandled error:", error);
      return fail("Something went wrong. Please try again.", 500);
    }
  };
}
