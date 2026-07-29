import { AssignmentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { updateAssignmentStatusSchema } from "@/lib/assignments/schema";
import { serializeAssignment } from "@/lib/assignments/serialize";
import { isAllowedStatusTransition } from "@/lib/assignments/status";
import { prisma } from "@/lib/prisma";

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id === null) {
    return NextResponse.json({ error: "invalid assignment id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (body === null) {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const parsed = updateAssignmentStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.assignment.findUnique({ where: { id } });
  if (existing === null) {
    return NextResponse.json({ error: "과제를 찾을 수 없습니다" }, { status: 404 });
  }

  const nextStatus = parsed.data.status;
  if (!isAllowedStatusTransition(existing.status, nextStatus)) {
    return NextResponse.json(
      { error: `${existing.status} → ${nextStatus} 전이는 허용되지 않습니다` },
      { status: 409 },
    );
  }

  const updated = await prisma.assignment.update({
    where: { id },
    data: {
      status: nextStatus,
      completedAt: nextStatus === AssignmentStatus.DONE ? new Date() : null,
    },
  });
  return NextResponse.json(serializeAssignment(updated));
}
