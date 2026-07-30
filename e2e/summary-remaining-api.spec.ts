import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

// beforeAll은 이 파일을 실행하는 워커마다 한 번씩 돌기 때문에 (docs/decisions.md 참조),
// DB 상태를 공유하는 이 파일은 한 워커에서 순서대로 실행한다.
test.describe.configure({ mode: "serial" });

const prisma = new PrismaClient();

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function todayKST(): string {
  return new Date(Date.now() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

function addDaysKST(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day));
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

// lib/date.ts의 weekRangeKST와 동일한 계산(달력 주, 월요일 시작)을 테스트에서 독립적으로 재현.
function sundayOfWeekKST(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0=일 ... 6=토
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  return addDaysKST(addDaysKST(date, mondayOffset), 6);
}

const assignmentIds: number[] = [];

test.afterAll(async () => {
  await prisma.assignment.deleteMany({ where: { id: { in: assignmentIds } } });
  await prisma.$disconnect();
});

async function createDiary(request: import("@playwright/test").APIRequestContext, date: string, title: string) {
  const response = await request.post("/api/assignments", {
    data: { date, type: "DIARY", title },
  });
  const body = await response.json();
  assignmentIds.push(body.id);
  return body;
}

test("밀린 것 / 오늘 / 이번 주로 날짜 조건에 따라 정확히 나뉜다", async ({ request }) => {
  const today = todayKST();
  const weekEnd = sundayOfWeekKST(today);
  const nextWeekDate = addDaysKST(weekEnd, 1); // 항상 "이번 주" 밖 — 요일과 무관하게 결정적

  const overdue = await createDiary(request, "2020-01-01", "__e2e_summary_overdue__");
  const todayItem = await createDiary(request, today, "__e2e_summary_today__");
  const nextWeekItem = await createDiary(request, nextWeekDate, "__e2e_summary_nextweek__");

  const response = await request.get("/api/summary/remaining");
  expect(response.ok()).toBe(true);
  const body = await response.json();

  expect(body.date).toBe(today);

  const ids = (list: { id: number }[]) => list.map((a) => a.id);

  expect(ids(body.overdue)).toContain(overdue.id);
  expect(ids(body.today)).toContain(todayItem.id);
  expect(ids(body.overdue)).not.toContain(todayItem.id);
  expect(ids(body.today)).not.toContain(overdue.id);

  // 다음 주로 확정 배정한 항목은 세 버킷 어디에도 없어야 한다.
  expect(ids(body.overdue)).not.toContain(nextWeekItem.id);
  expect(ids(body.today)).not.toContain(nextWeekItem.id);
  expect(ids(body.thisWeek)).not.toContain(nextWeekItem.id);

  expect(body.counts.overdue).toBe(body.overdue.length);
  expect(body.counts.today).toBe(body.today.length);
  expect(body.counts.thisWeek).toBe(body.thisWeek.length);

  expect(body.overdue[0]).toHaveProperty("isOverdue", true);
  expect(body.today[0]).toHaveProperty("isOverdue", false);
});

test("오늘이 일요일이 아니면, 내일부터 이번 주 일요일까지는 이번 주 버킷에 들어간다", async ({
  request,
}) => {
  const today = todayKST();
  const weekEnd = sundayOfWeekKST(today);
  const tomorrow = addDaysKST(today, 1);

  test.skip(tomorrow > weekEnd, "오늘이 이번 주 일요일이라 '내일'이 이미 다음 주임 — 결정적으로 재현 불가");

  const thisWeekBoundary = await createDiary(request, weekEnd, "__e2e_summary_thisweek_boundary__");

  const response = await request.get("/api/summary/remaining");
  const body = await response.json();
  const ids = (list: { id: number }[]) => list.map((a: { id: number }) => a.id);

  expect(ids(body.thisWeek)).toContain(thisWeekBoundary.id);
  expect(ids(body.overdue)).not.toContain(thisWeekBoundary.id);
  expect(ids(body.today)).not.toContain(thisWeekBoundary.id);
});

test("DONE·SKIPPED 상태는 어느 버킷에도 나타나지 않는다", async ({ request }) => {
  const today = todayKST();
  const done = await createDiary(request, "2020-01-02", "__e2e_summary_done__");
  await request.patch(`/api/assignments/${done.id}/status`, { data: { status: "DONE" } });

  const skipped = await createDiary(request, today, "__e2e_summary_skipped__");
  await request.patch(`/api/assignments/${skipped.id}/status`, { data: { status: "SKIPPED" } });

  const response = await request.get("/api/summary/remaining");
  const body = await response.json();
  const allIds = [
    ...body.overdue.map((a: { id: number }) => a.id),
    ...body.today.map((a: { id: number }) => a.id),
    ...body.thisWeek.map((a: { id: number }) => a.id),
  ];

  expect(allIds).not.toContain(done.id);
  expect(allIds).not.toContain(skipped.id);
});
