import { NextResponse } from "next/server";
import { getSignalStats } from "@/lib/store";

export async function GET() {
  const stats = await getSignalStats();
  return NextResponse.json({ success: true, data: stats });
}
