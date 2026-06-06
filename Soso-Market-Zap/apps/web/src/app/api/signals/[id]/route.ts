import { NextResponse } from "next/server";
import { getSignal, updateSignal } from "@/lib/store";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const signal = await getSignal(id);
  if (!signal) {
    return NextResponse.json({ success: false, error: "Signal not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: signal });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const update = await req.json();
  const signal = await updateSignal(id, update);
  if (!signal) {
    return NextResponse.json({ success: false, error: "Signal not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: signal });
}
