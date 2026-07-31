import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

// "/manage/books"는 전체 Book 목록을 보여주는 화면이라 다른 spec 파일(books-api.spec.ts
// 등)이 병렬로 만드는 책과 같은 화면에 섞일 수 있어, 이 테스트가 만든 책만 고유한
// 제목으로 식별한다. Book에는 DELETE API가 없어(architecture.md §5에 없음) 정리는
// prisma로 직접 한다 — books-api.spec.ts와 동일한 방식.
test.describe.configure({ mode: "serial" });

const prisma = new PrismaClient();
const bookIds: number[] = [];
const assignmentIds: number[] = [];

test.afterAll(async () => {
  await prisma.assignment.deleteMany({ where: { id: { in: assignmentIds } } });
  await prisma.book.deleteMany({ where: { id: { in: bookIds } } });
  await prisma.$disconnect();
});

test("책 추가 폼으로 새 책을 만들면 목록에 나타난다", async ({ page }) => {
  await page.goto("/manage/books");

  await page.locator('section:has-text("책 추가") input[type="text"]').fill("__e2e_manage_books_add__");
  await page.locator('section:has-text("책 추가") select').selectOption("KO");

  const [response] = await Promise.all([
    page.waitForResponse(
      (res) => res.url().endsWith("/api/books") && res.request().method() === "POST",
    ),
    page.getByRole("button", { name: "추가" }).click(),
  ]);
  expect(response.status()).toBe(201);
  const created = await prisma.book.findFirst({ where: { title: "__e2e_manage_books_add__" } });
  if (created) bookIds.push(created.id);

  const row = page.locator("li", { hasText: "__e2e_manage_books_add__" });
  await expect(row.getByText("한글 · 진행 기록 없음")).toBeVisible();
});

test("같은 제목·언어로 다시 추가하면 에러 메시지를 보여준다", async ({ page, request }) => {
  const created = await request.post("/api/books", {
    data: { title: "__e2e_manage_books_dup__", language: "EN" },
  });
  const createdBody = await created.json();
  bookIds.push(createdBody.id);

  await page.goto("/manage/books");
  await page.locator('section:has-text("책 추가") input[type="text"]').fill("__e2e_manage_books_dup__");
  await page.locator('section:has-text("책 추가") select').selectOption("EN");
  await page.getByRole("button", { name: "추가" }).click();

  await expect(page.getByText("이미 같은 제목·언어의 책이 존재합니다")).toBeVisible();
});

test("수정 폼으로 필드를 바꿀 수 있고, 취소하면 바뀌지 않는다", async ({ page, request }) => {
  const created = await request.post("/api/books", {
    data: { title: "__e2e_manage_books_edit__", language: "EN" },
  });
  const createdBody = await created.json();
  bookIds.push(createdBody.id);

  await page.goto("/manage/books");
  const rowByText = page.locator("li", { hasText: "__e2e_manage_books_edit__" });
  await rowByText.getByRole("button", { name: "수정" }).click();

  // 수정 모드 진입 후에는 제목이 input value로 옮겨가 hasText가 못 잡을 수 있어
  // 구조적으로(저장 버튼이 있는 li) 다시 특정한다.
  const editingRow = page.locator("ul > li").filter({ has: page.getByRole("button", { name: "저장" }) });
  await editingRow.locator('input[type="text"]').fill("__e2e_manage_books_edited__");
  await editingRow.locator('input[type="number"]').first().fill("30");
  const [patchResponse] = await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes(`/api/books/${createdBody.id}`) && res.request().method() === "PATCH",
    ),
    editingRow.getByRole("button", { name: "저장" }).click(),
  ]);
  expect(patchResponse.status()).toBe(200);

  const afterEdit = await request.get("/api/books");
  const edited = (await afterEdit.json()).find((b: { id: number }) => b.id === createdBody.id);
  expect(edited.title).toBe("__e2e_manage_books_edited__");
  expect(edited.totalChapters).toBe(30);

  // 취소 케이스
  const rowAfterEdit = page.locator("li", { hasText: "__e2e_manage_books_edited__" });
  await rowAfterEdit.getByRole("button", { name: "수정" }).click();
  const editingRow2 = page.locator("ul > li").filter({ has: page.getByRole("button", { name: "저장" }) });
  await editingRow2.locator('input[type="text"]').fill("__e2e_manage_books_should_not_save__");
  await editingRow2.getByRole("button", { name: "취소" }).click();

  const afterCancel = await request.get("/api/books");
  const stillEdited = (await afterCancel.json()).find(
    (b: { id: number }) => b.id === createdBody.id,
  );
  expect(stillEdited.title).toBe("__e2e_manage_books_edited__");
});

test("진도 현황은 가장 최근 READING 과제의 진도를 총량과 함께 보여준다", async ({
  page,
  request,
}) => {
  const created = await request.post("/api/books", {
    data: { title: "__e2e_manage_books_progress__", language: "EN", totalChapters: 20 },
  });
  const createdBody = await created.json();
  bookIds.push(createdBody.id);

  const first = await request.post("/api/assignments", {
    data: {
      date: "2026-07-29",
      type: "READING",
      title: "__e2e_progress_1__",
      bookId: createdBody.id,
      progressUnit: "CHAPTER",
      progressEnd: 6,
    },
  });
  assignmentIds.push((await first.json()).id);

  const second = await request.post("/api/assignments", {
    data: {
      date: "2026-07-30",
      type: "READING",
      title: "__e2e_progress_2__",
      bookId: createdBody.id,
      progressUnit: "CHAPTER",
      progressEnd: 12,
    },
  });
  assignmentIds.push((await second.json()).id);

  await page.goto("/manage/books");
  const row = page.locator("li", { hasText: "__e2e_manage_books_progress__" });
  await expect(row.getByText("ch.12 / 20")).toBeVisible();
  await expect(row.getByText("ch.6", { exact: true })).toHaveCount(0);
});

test("/calendar에 책 관리로 가는 링크가 있고, 관리 화면에는 달력으로 돌아가는 링크가 있다", async ({
  page,
}) => {
  await page.goto("/calendar");
  await page.getByRole("link", { name: "책 관리 →" }).click();
  await expect(page).toHaveURL(/\/manage\/books$/);

  await page.getByRole("link", { name: "← 달력으로" }).click();
  await expect(page).toHaveURL(/\/calendar$/);
});
