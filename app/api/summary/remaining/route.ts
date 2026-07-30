import { NextResponse } from "next/server";

import { getRemainingSummary } from "@/lib/summary/remaining";

export async function GET() {
  return NextResponse.json(await getRemainingSummary());
}
