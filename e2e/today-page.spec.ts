import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

// 이 파일은 "/" 페이지가 전체 DB 상태를 보여주는 화면이라 다른 spec 파일이 병렬로
// 만드는 항목과 같은 화면에 섞일 수 있다. 그래서 헤더의 정확한 개수(N개)는 검증하지
// 않고, 이 테스트가 만든 항목이 aria-label(체크박스 접근성 이름 = 표시 텍스트)로
// 정확히 식별되는지만 검증한다.
test.describe.configure({ mode: "serial" });

const prisma = new PrismaClient();
const assignmentIds: number[] = [];

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
function todayKST(): string {
  return new Date(Date.now() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

test.afterAll(async () => {
  await prisma.assignment.deleteMany({ where: { id: { in: assignmentIds } } });
  await prisma.$disconnect();
});

test("하단 내비게이션 3탭이 보이고 달력·시간표로 이동할 수 있다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "오늘" })).toBeVisible();
  await expect(page.getByRole("link", { name: "달력" })).toBeVisible();
  await expect(page.getByRole("link", { name: "시간표" })).toBeVisible();

  await page.getByRole("link", { name: "달력" }).click();
  await expect(page).toHaveURL(/\/calendar$/);
  await expect(page.getByRole("heading", { name: "달력" })).toBeVisible();

  await page.getByRole("link", { name: "시간표" }).click();
  await expect(page).toHaveURL(/\/schedule$/);
  await expect(page.getByText("시간표 화면은 준비 중이에요.")).toBeVisible();
});

test("밀린 과제가 밀린 것 섹션에 날짜와 함께 나타난다", async ({ request, page }) => {
  const created = await request.post("/api/assignments", {
    data: { date: "2020-01-01", type: "DIARY", title: "__e2e_page_overdue__" },
  });
  const createdBody = await created.json();
  assignmentIds.push(createdBody.id);

  await page.goto("/");
  await expect(page.getByText(/⚠ 밀린 것 \d+개/)).toBeVisible();
  const row = page.getByRole("checkbox", { name: "__e2e_page_overdue__" }).locator("..");
  await expect(row).toBeVisible();
  await expect(row.getByText("1/1")).toBeVisible();
});

test("READING 과제는 진도가 라벨에 붙어서 나타난다", async ({ request, page }) => {
  const book = await request.post("/api/books", {
    data: { title: "__e2e_page_book__", language: "EN" },
  });
  const bookBody = await book.json();

  const today = todayKST();
  const created = await request.post("/api/assignments", {
    data: {
      date: today,
      type: "READING",
      title: "__e2e_page_reading__",
      bookId: bookBody.id,
      progressUnit: "CHAPTER",
      progressEnd: 6,
    },
  });
  const createdBody = await created.json();
  assignmentIds.push(createdBody.id);

  await page.goto("/");
  await expect(
    page.getByRole("checkbox", { name: "__e2e_page_reading__ ch.6" }),
  ).toBeVisible();

  await prisma.assignment.delete({ where: { id: createdBody.id } });
  assignmentIds.splice(assignmentIds.indexOf(createdBody.id), 1);
  await prisma.book.delete({ where: { id: bookBody.id } });
});

test("체크박스를 누르면 오늘 과제가 완료로 바뀌고 다시 누르면 되돌아간다", async ({
  request,
  page,
}) => {
  const today = todayKST();
  const created = await request.post("/api/assignments", {
    data: { date: today, type: "WORKSHEET", title: "__e2e_page_toggle__" },
  });
  const createdBody = await created.json();
  assignmentIds.push(createdBody.id);

  await page.goto("/");
  const checkbox = page.getByRole("checkbox", { name: "__e2e_page_toggle__" });
  await expect(checkbox).not.toBeChecked();

  await checkbox.click();
  await expect(checkbox).toBeChecked();
  const afterCheck = await request.get(`/api/assignments/${createdBody.id}`);
  expect((await afterCheck.json()).status).toBe("DONE");

  await checkbox.click();
  await expect(checkbox).not.toBeChecked();
  const afterUncheck = await request.get(`/api/assignments/${createdBody.id}`);
  expect((await afterUncheck.json()).status).toBe("PLANNED");
});

test("SKIPPED 상태의 오늘 과제는 화면에 나타나지 않는다", async ({ request, page }) => {
  const today = todayKST();
  const created = await request.post("/api/assignments", {
    data: { date: today, type: "DIARY", title: "__e2e_page_skipped__" },
  });
  const createdBody = await created.json();
  assignmentIds.push(createdBody.id);
  await request.patch(`/api/assignments/${createdBody.id}/status`, {
    data: { status: "SKIPPED" },
  });

  await page.goto("/");
  await expect(page.getByRole("checkbox", { name: "__e2e_page_skipped__" })).toHaveCount(0);
});
