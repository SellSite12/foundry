import { NextRequest } from "next/server";

export const PAGE_SIZE = 25;

export function getPagination(req: NextRequest): { page: number; take: number; skip: number } {
  const raw = req.nextUrl.searchParams.get("page");
  const page = Math.max(1, Math.min(10_000, parseInt(raw ?? "1", 10) || 1));
  return { page, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE };
}

export function pageMeta(total: number, page: number) {
  return {
    total,
    page,
    pageSize: PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}
