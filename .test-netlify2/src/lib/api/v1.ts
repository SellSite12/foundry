import { NextRequest } from "next/server";

export type PaginationParams = {
  page: number;
  limit: number;
  skip: number;
  sort?: string;
  order: "asc" | "desc";
  q?: string;
};

export function parsePagination(req: NextRequest): PaginationParams {
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit") ?? 25)));
  const sort = sp.get("sort") ?? undefined;
  const order = sp.get("order") === "asc" ? "asc" : "desc";
  const q = sp.get("q") ?? sp.get("search") ?? undefined;
  return { page, limit, skip: (page - 1) * limit, sort, order, q };
}

export function paginated<T>(items: T[], total: number, params: PaginationParams) {
  return {
    items,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      pages: Math.ceil(total / params.limit),
    },
  };
}
