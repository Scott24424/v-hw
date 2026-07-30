import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

// beforeAll/afterAll이 파일당 워커마다 한 번씩 돌고, 다른 spec 파일이 병렬로
// RoutineBlock을 만들고 지우는 중일 수 있어 이 파일은 한 워커에서 순서대로 실행한다.
// 응답 배열은 전체 DB를 반영하므로 아래 검증도 (다른 파일에 있을 항목까지 포함해서)
// 정확한 존재 여부만 확인하고 배열 전체를 비교하지 않는다.
test.describe.configure({ mode: "serial" });

const prisma = new PrismaClient();
const blockIds: number[] = [];
const assignmentIds: number[] = [];

test.afterAll(async () => {
  await prisma.assignment.deleteMany({ where: { id: { in: assignmentIds } } });
  await prisma.routineBlock.deleteMany({ where: { id: { in: blockIds } } });
  await prisma.$disconnect();
});

test("잘못된 날짜 형식은 400을 반환한다", async ({ request }) => {
  const response = await request.get("/api/days/2026-13-01");
  expect(response.status()).toBe(400);
});

test("활성 블록에 연결된 과제는 그 블록 밑에, 미연결 과제는 별도로 나타난다", async ({
  request,
}) => {
  const date = "2026-07-29";

  const block = await request.post("/api/routine-blocks", {
    data: { startMinute: 480, endMinute: 600, label: "__e2e_days_active_block__" },
  });
  const blockBody = await block.json();
  blockIds.push(blockBody.id);

  const linked = await request.post("/api/assignments", {
    data: { date, type: "WORKSHEET", title: "__e2e_days_linked__", routineBlockId: blockBody.id },
  });
  const linkedBody = await linked.json();
  assignmentIds.push(linkedBody.id);

  const unlinked = await request.post("/api/assignments", {
    data: { date, type: "DIARY", title: "__e2e_days_unlinked__" },
  });
  const unlinkedBody = await unlinked.json();
  assignmentIds.push(unlinkedBody.id);

  const response = await request.get(`/api/days/${date}`);
  expect(response.ok()).toBe(true);
  const body = await response.json();
  expect(body.date).toBe(date);

  const returnedBlock = body.blocks.find((b: { id: number }) => b.id === blockBody.id);
  expect(returnedBlock).toBeDefined();
  expect(returnedBlock.assignments.map((a: { id: number }) => a.id)).toContain(linkedBody.id);

  expect(
    body.unlinkedAssignments.some((a: { id: number }) => a.id === unlinkedBody.id),
  ).toBe(true);
  expect(returnedBlock.assignments.some((a: { id: number }) => a.id === unlinkedBody.id)).toBe(
    false,
  );
});

test("비활성 블록은 blocks 목록에 없지만, 거기 연결된 과제는 미연결로 나타난다", async ({
  request,
}) => {
  const date = "2026-07-29";

  const block = await request.post("/api/routine-blocks", {
    data: { startMinute: 750, endMinute: 765, label: "__e2e_days_inactive_block__" },
  });
  const blockBody = await block.json();
  blockIds.push(blockBody.id);

  const linked = await request.post("/api/assignments", {
    data: {
      date,
      type: "WORKSHEET",
      title: "__e2e_days_orphan__",
      routineBlockId: blockBody.id,
    },
  });
  const linkedBody = await linked.json();
  assignmentIds.push(linkedBody.id);

  await request.patch(`/api/routine-blocks/${blockBody.id}`, { data: { isActive: false } });

  const response = await request.get(`/api/days/${date}`);
  const body = await response.json();

  expect(body.blocks.some((b: { id: number }) => b.id === blockBody.id)).toBe(false);
  expect(
    body.unlinkedAssignments.some((a: { id: number }) => a.id === linkedBody.id),
  ).toBe(true);
});

test("다른 날짜의 과제는 나타나지 않는다", async ({ request }) => {
  const otherDate = "2020-01-01";

  const created = await request.post("/api/assignments", {
    data: { date: otherDate, type: "DIARY", title: "__e2e_days_other_date__" },
  });
  const createdBody = await created.json();
  assignmentIds.push(createdBody.id);

  const response = await request.get("/api/days/2026-07-29");
  const body = await response.json();

  const allIds = [
    ...body.unlinkedAssignments.map((a: { id: number }) => a.id),
    ...body.blocks.flatMap((b: { assignments: { id: number }[] }) =>
      b.assignments.map((a) => a.id),
    ),
  ];
  expect(allIds).not.toContain(createdBody.id);
});
