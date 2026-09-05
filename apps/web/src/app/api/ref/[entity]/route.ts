import type { NextRequest } from "next/server";
import { apiContext } from "@/lib/api-auth";
import { refOptions } from "@/lib/crud";
export const dynamic = "force-dynamic";
export async function GET(_req: NextRequest, ctx: { params: Promise<{ entity: string }> }) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { entity } = await ctx.params;
  try { return Response.json({ options: await refOptions(c.d1, entity) }); }
  catch (e) { return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 }); }
}
