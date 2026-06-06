import { NextResponse } from "next/server";
import { getSignal, updateSignal } from "@/lib/store";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { type, details } = await req.json() as { type: "buy" | "sell" | "hold" | "create_market"; details: string };
  const signal = updateSignal(id, {
    acted: true,
    action: { type, details, timestamp: new Date().toISOString() },
  });
  if (!signal) {
    return NextResponse.json({ success: false, error: "Signal not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: signal });
}
