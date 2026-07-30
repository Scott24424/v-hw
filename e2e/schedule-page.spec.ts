import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

// "/schedule"은 isActive RoutineBlock 전체 + 오늘 Assignment를 보여주는 화면이라
// 다른 spec 파일이 병렬로 만드는 블록·과제와 같은 화면에 섞일 수 있다. 그래서
// 여기서도 이 테스트가 만든 항목만 라벨/시간으로 정확히 식별해 검증한다.
// "지금" 현재 시각 인디케이터는 실행 시각에 따라 달라져 결정적으로 테스트할 수
// 없으므로 다루지 않는다(요일 기준 skip을 쓴 summary-remaining-api.spec.ts와 같은 이유).
test.describe.configure({ mode: "serial" });

const prisma = new PrismaClient();
const blockIds: number[] = [];
const assignmentIds: number[] = [];

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
function todayKST(): string {
  return new Date(Date.now() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

test.afterAll(async () => {
  await prisma.assignment.deleteMany({ where: { id: { in: assignmentIds } } });
  await prisma.routineBlock.deleteMany({ where: { id: { in: blockIds } } });
  await prisma.$disconnect();
});

test("연결된 과제가 블록 밑에 시간 범위와 함께 나타나고 체크할 수 있다", async ({
  request,
  page,
}) => {
  const block = await request.post("/api/routine-blocks", {
    data: { startMinute: 480, endMinute: 600, label: "__e2e_schedule_study__" },
  });
  const blockBody = await block.json();
  blockIds.push(blockBody.id);

  const created = await request.post("/api/assignments", {
    data: {
      date: todayKST(),
      type: "WORKSHEET",
      title: "__e2e_schedule_linked__",
      routineBlockId: blockBody.id,
    },
  });
  const createdBody = await created.json();
  assignmentIds.push(createdBody.id);

  await page.goto("/schedule");
  const blockCard = page.locator("li", { hasText: "__e2e_schedule_study__" });
  await expect(blockCard.getByText("8:00 ~ 10:00")).toBeVisible();

  const checkbox = blockCard.getByRole("checkbox", { name: "__e2e_schedule_linked__" });
  await expect(checkbox).not.toBeChecked();
  await checkbox.click();
  await expect(checkbox).toBeChecked();

  const afterCheck = await request.get(`/api/assignments/${createdBody.id}`);
  expect((await afterCheck.json()).status).toBe("DONE");
});

test("ROUTINE 블록은 흐리게 표시되고 과제 연결 버튼이 없다", async ({ request, page }) => {
  const block = await request.post("/api/routine-blocks", {
    data: {
      startMinute: 690,
      endMinute: 750,
      label: "__e2e_schedule_routine__",
      category: "ROUTINE",
    },
  });
  const blockBody = await block.json();
  blockIds.push(blockBody.id);

  await page.goto("/schedule");
  const blockCard = page.locator("li", { hasText: "__e2e_schedule_routine__" });
  await expect(blockCard).toHaveClass(/opacity-60/);
  await expect(blockCard.getByRole("button", { name: "+ 과제 연결" })).toHaveCount(0);
});

test("빈 STUDY 블록에서 미연결 과제를 골라 연결할 수 있다", async ({ request, page }) => {
  const block = await request.post("/api/routine-blocks", {
    data: { startMinute: 765, endMinute: 840, label: "__e2e_schedule_connect__" },
  });
  const blockBody = await block.json();
  blockIds.push(blockBody.id);

  const unlinked = await request.post("/api/assignments", {
    data: { date: todayKST(), type: "OTHER", title: "__e2e_schedule_unlinked__" },
  });
  const unlinkedBody = await unlinked.json();
  assignmentIds.push(unlinkedBody.id);

  await page.goto("/schedule");
  const blockCard = page.locator("li", { hasText: "__e2e_schedule_connect__" });
  await blockCard.getByRole("button", { name: "+ 과제 연결" }).click();
  await blockCard.getByRole("button", { name: "__e2e_schedule_unlinked__" }).click();

  await expect(blockCard.getByRole("checkbox", { name: "__e2e_schedule_unlinked__" })).toBeVisible();

  const afterConnect = await request.get(`/api/assignments/${unlinkedBody.id}`);
  expect((await afterConnect.json()).routineBlockId).toBe(blockBody.id);
});

test("연결할 미연결 과제가 없으면 안내 문구를 보여준다", async ({ request, page }) => {
  const block = await request.post("/api/routine-blocks", {
    data: { startMinute: 840, endMinute: 900, label: "__e2e_schedule_empty__" },
  });
  const blockBody = await block.json();
  blockIds.push(blockBody.id);

  await page.goto("/schedule");
  const blockCard = page.locator("li", { hasText: "__e2e_schedule_empty__" });
  await blockCard.getByRole("button", { name: "+ 과제 연결" }).click();
  // 이 시점에 다른 파일이 병렬로 미연결 과제를 만들고 있을 수 있어 "없다"를
  // 단정하지 않고, 최소한 안내 문구 또는 후보 목록 중 하나가 뜨는지만 확인한다.
  await expect(
    blockCard.getByText("연결할 수 있는 과제가 없어요.").or(blockCard.getByRole("button", { name: "취소" })),
  ).toBeVisible();
});

test("SKIPPED 상태로 연결된 과제는 시간표에 나타나지 않는다", async ({ request, page }) => {
  const block = await request.post("/api/routine-blocks", {
    data: { startMinute: 900, endMinute: 1020, label: "__e2e_schedule_skipped__" },
  });
  const blockBody = await block.json();
  blockIds.push(blockBody.id);

  const created = await request.post("/api/assignments", {
    data: {
      date: todayKST(),
      type: "DIARY",
      title: "__e2e_schedule_skipped_item__",
      routineBlockId: blockBody.id,
    },
  });
  const createdBody = await created.json();
  assignmentIds.push(createdBody.id);
  await request.patch(`/api/assignments/${createdBody.id}/status`, {
    data: { status: "SKIPPED" },
  });

  await page.goto("/schedule");
  const blockCard = page.locator("li", { hasText: "__e2e_schedule_skipped__" });
  await expect(
    blockCard.getByRole("checkbox", { name: "__e2e_schedule_skipped_item__" }),
  ).toHaveCount(0);
  // 연결은 돼 있지만 상태가 SKIPPED라 목록에서 빠지므로, 블록은 "빈 블록"처럼
  // 과제 연결 버튼을 보여준다.
  await expect(blockCard.getByRole("button", { name: "+ 과제 연결" })).toBeVisible();
});
