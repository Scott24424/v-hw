import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

// 이 파일은 "/calendar" 전체 그리드(7/29~8/17 고정 범위)를 보여주는 화면이라
// 다른 spec 파일이 병렬로 그 범위 안 날짜에 항목을 만들면 같은 화면에 섞일 수 있다.
// 그래서 이 테스트가 만든 항목만 aria-label(=표시 텍스트)로 정확히 식별해 검증한다.
test.describe.configure({ mode: "serial" });

const prisma = new PrismaClient();
const assignmentIds: number[] = [];

test.afterAll(async () => {
  await prisma.assignment.deleteMany({ where: { id: { in: assignmentIds } } });
  await prisma.$disconnect();
});

test("그리드가 7/29~8/17을 5열×4행으로 보여주고, 만든 과제가 해당 날짜 칸에 나타난다", async ({
  request,
  page,
}) => {
  const created = await request.post("/api/assignments", {
    data: { date: "2026-07-31", type: "DIARY", title: "__e2e_calendar_grid__" },
  });
  const createdBody = await created.json();
  assignmentIds.push(createdBody.id);

  await page.goto("/calendar");
  await expect(page.getByText("7/29")).toBeVisible();
  await expect(page.getByText("8/1")).toBeVisible();
  await expect(page.getByText("17", { exact: true })).toBeVisible();

  const cell = page.locator('a[href="/calendar/2026-07-31"]');
  await expect(cell.getByText("__e2e_calendar_grid__")).toBeVisible();
});

test("완료된 과제는 칸 안에서 취소선으로 표시된다", async ({ request, page }) => {
  const created = await request.post("/api/assignments", {
    data: { date: "2026-08-05", type: "DIARY", title: "__e2e_calendar_done__" },
  });
  const createdBody = await created.json();
  assignmentIds.push(createdBody.id);
  await request.patch(`/api/assignments/${createdBody.id}/status`, {
    data: { status: "DONE" },
  });

  await page.goto("/calendar");
  const chip = page.locator('a[href="/calendar/2026-08-05"]').getByText("__e2e_calendar_done__");
  await expect(chip).toHaveClass(/line-through/);
});

test("날짜 칸을 탭하면 그날 상세로 이동하고, 거기서 완료 체크를 할 수 있다", async ({
  request,
  page,
}) => {
  const created = await request.post("/api/assignments", {
    data: { date: "2026-08-10", type: "WORKSHEET", title: "__e2e_calendar_tap__" },
  });
  const createdBody = await created.json();
  assignmentIds.push(createdBody.id);

  await page.goto("/calendar");
  await page.locator('a[href="/calendar/2026-08-10"]').click();
  await expect(page).toHaveURL(/\/calendar\/2026-08-10$/);
  await expect(page.getByText("8월 10일")).toBeVisible();

  const checkbox = page.getByRole("checkbox", { name: "__e2e_calendar_tap__" });
  await expect(checkbox).not.toBeChecked();
  await checkbox.click();
  await expect(checkbox).toBeChecked();

  const afterCheck = await request.get(`/api/assignments/${createdBody.id}`);
  expect((await afterCheck.json()).status).toBe("DONE");
});

test("계획이 없는 날은 빈 칸으로 남고 안내 문구가 없다", async ({ page }) => {
  await page.goto("/calendar/2026-08-14");
  await expect(page.getByText("이 날은 계획된 과제가 없어요.")).toBeVisible();
});

test("SKIPPED 상태의 과제는 그날 상세 화면에 나타나지 않는다", async ({ request, page }) => {
  const created = await request.post("/api/assignments", {
    data: { date: "2026-08-11", type: "DIARY", title: "__e2e_calendar_skipped__" },
  });
  const createdBody = await created.json();
  assignmentIds.push(createdBody.id);
  await request.patch(`/api/assignments/${createdBody.id}/status`, {
    data: { status: "SKIPPED" },
  });

  await page.goto("/calendar/2026-08-11");
  await expect(page.getByRole("checkbox", { name: "__e2e_calendar_skipped__" })).toHaveCount(0);
});

test("잘못된 날짜 형식으로 접근하면 404를 보여준다", async ({ page }) => {
  const response = await page.goto("/calendar/not-a-date");
  expect(response?.status()).toBe(404);
});
