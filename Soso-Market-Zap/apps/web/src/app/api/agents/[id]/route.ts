import { NextResponse } from "next/server";
import { getAgent, upsertAgent } from "@/lib/store";
import type { AgentConfig } from "@market-zap/shared";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = getAgent(id);
  if (!agent) {
    return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: agent });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const config = await req.json() as AgentConfig;
  config.id = id;
  config.updatedAt = new Date().toISOString();
  if (!config.createdAt) config.createdAt = config.updatedAt;
  upsertAgent(config);
  return NextResponse.json({ success: true, data: config });
}
