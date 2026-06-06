import { NextResponse } from "next/server";
import { getAgents } from "@/lib/store";

export async function GET() {
  const agents = await getAgents();
  return NextResponse.json({ success: true, data: { agents } });
}
