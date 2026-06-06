import { NextResponse } from "next/server";
import { getSignals, addSignal } from "@/lib/store";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "50"), 1), 200);
  const offset = Math.max(parseInt(url.searchParams.get("offset") || "0"), 0);
  const { items, total } = await getSignals(limit, offset);
  return NextResponse.json({
    success: true,
    data: {
      items,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      hasMore: offset + limit < total,
    },
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  await addSignal(body);
  return NextResponse.json({ success: true, data: body }, { status: 201 });
}
