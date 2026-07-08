import { randomBytes } from "crypto";

import { headers } from "next/headers";

const HEADER = "x-request-id";

export function generateRequestId(): string {
  return `req_${randomBytes(12).toString("hex")}`;
}

export async function getRequestId(): Promise<string> {
  try {
    const hdrs = await headers();
    return hdrs.get(HEADER) ?? generateRequestId();
  } catch {
    return generateRequestId();
  }
}

export { HEADER as REQUEST_ID_HEADER };
