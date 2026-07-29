import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

// beforeAll은 이 파일을 실행하는 워커마다 한 번씩 돌기 때문에 (docs/decisions.md 참조),
// DB 상태를 공유하는 이 파일은 한 워커에서 순서대로 실행한다.
test.describe.configure({ mode: "serial" });

const prisma = new PrismaClient();

let bookId: number | undefined;
const assignmentIds: number[] = [];

test.beforeAll(async ({ request }) => {
  const response = await request.post("/api/books", {
    data: { title: "__e2e_detail_book__", language: "EN" },
  });
  const book = await response.json();
  bookId = book.id;
});

test.afterAll(async () => {
  await prisma.assignment.deleteMany({ where: { id: { in: assignmentIds } } });
  if (bookId !== undefined) {
    await prisma.book.delete({ where: { id: bookId } });
  }
  await prisma.$disconnect();
});

test("READING이 아닌 과제를 부분 수정할 수 있다", async ({ request }) => {
  const created = await request.post("/api/assignments", {
    data: { date: "2026-07-29", type: "DIARY", title: "__e2e_diary__" },
  });
  const createdBody = await created.json();
  assignmentIds.push(createdBody.id);

  const patched = await request.patch(`/api/assignments/${createdBody.id}`, {
    data: { title: "__e2e_diary_수정됨__", sortOrder: 3 },
  });
  expect(patched.ok()).toBe(true);
  const patchedBody = await patched.json();
  expect(patchedBody.title).toBe("__e2e_diary_수정됨__");
  expect(patchedBody.sortOrder).toBe(3);
});

test("READING 과제의 진도를 수정할 수 있다", async ({ request }) => {
  const created = await request.post("/api/assignments", {
    data: {
      date: "2026-07-29",
      type: "READING",
      title: "__e2e_reading__",
      bookId,
      progressUnit: "CHAPTER",
      progressEnd: 6,
    },
  });
  const createdBody = await created.json();
  assignmentIds.push(createdBody.id);

  const patched = await request.patch(`/api/assignments/${createdBody.id}`, {
    data: { progressEnd: 8 },
  });
  expect(patched.ok()).toBe(true);
  const patchedBody = await patched.json();
  expect(patchedBody.progressEnd).toBe(8);
  expect(patchedBody.progressStart).toBe(1);
});

test("READING 과제 수정 시 progressStart가 progressEnd보다 커지면 400을 반환한다", async ({
  request,
}) => {
  const created = await request.post("/api/assignments", {
    data: {
      date: "2026-07-29",
      type: "READING",
      title: "__e2e_reading_range__",
      bookId,
      progressUnit: "CHAPTER",
      progressStart: 5,
      progressEnd: 10,
    },
  });
  const createdBody = await created.json();
  assignmentIds.push(createdBody.id);

  const patched = await request.patch(`/api/assignments/${createdBody.id}`, {
    data: { progressEnd: 3 },
  });
  expect(patched.status()).toBe(400);
});

test("READING이 아닌 과제에 진도 필드를 수정하려 하면 400을 반환한다", async ({ request }) => {
  const created = await request.post("/api/assignments", {
    data: { date: "2026-07-29", type: "WORKSHEET", title: "__e2e_worksheet__" },
  });
  const createdBody = await created.json();
  assignmentIds.push(createdBody.id);

  const patched = await request.patch(`/api/assignments/${createdBody.id}`, {
    data: { progressEnd: 5 },
  });
  expect(patched.status()).toBe(400);
});

test("존재하지 않는 routineBlockId로 수정하면 400을 반환한다", async ({ request }) => {
  const created = await request.post("/api/assignments", {
    data: { date: "2026-07-29", type: "DIARY", title: "__e2e_diary_fk__" },
  });
  const createdBody = await created.json();
  assignmentIds.push(createdBody.id);

  const patched = await request.patch(`/api/assignments/${createdBody.id}`, {
    data: { routineBlockId: 999_999 },
  });
  expect(patched.status()).toBe(400);
});

test("존재하지 않는 과제를 수정하면 404를 반환한다", async ({ request }) => {
  const response = await request.patch("/api/assignments/999999", {
    data: { title: "없는 과제" },
  });
  expect(response.status()).toBe(404);
});

test("과제를 삭제하면 목록에서 사라진다", async ({ request }) => {
  const created = await request.post("/api/assignments", {
    data: { date: "2026-07-29", type: "DIARY", title: "__e2e_diary_delete__" },
  });
  const createdBody = await created.json();

  const deleted = await request.delete(`/api/assignments/${createdBody.id}`);
  expect(deleted.status()).toBe(204);

  const list = await request.get("/api/assignments?from=2026-07-29&to=2026-07-29");
  const body = await list.json();
  expect(body.some((a: { id: number }) => a.id === createdBody.id)).toBe(false);
});

test("존재하지 않는 과제를 삭제하면 404를 반환한다", async ({ request }) => {
  const response = await request.delete("/api/assignments/999999");
  expect(response.status()).toBe(404);
});

test("PLANNED에서 DONE으로 상태를 바꾸면 completedAt이 채워진다", async ({ request }) => {
  const created = await request.post("/api/assignments", {
    data: { date: "2026-07-29", type: "DIARY", title: "__e2e_status_done__" },
  });
  const createdBody = await created.json();
  assignmentIds.push(createdBody.id);
  expect(createdBody.status).toBe("PLANNED");

  const patched = await request.patch(`/api/assignments/${createdBody.id}/status`, {
    data: { status: "DONE" },
  });
  expect(patched.ok()).toBe(true);
  const patchedBody = await patched.json();
  expect(patchedBody.status).toBe("DONE");
  expect(patchedBody.completedAt).not.toBeNull();
});

test("DONE에서 PLANNED로 되돌리면 completedAt이 null로 돌아간다", async ({ request }) => {
  const created = await request.post("/api/assignments", {
    data: { date: "2026-07-29", type: "DIARY", title: "__e2e_status_revert__" },
  });
  const createdBody = await created.json();
  assignmentIds.push(createdBody.id);

  await request.patch(`/api/assignments/${createdBody.id}/status`, { data: { status: "DONE" } });
  const reverted = await request.patch(`/api/assignments/${createdBody.id}/status`, {
    data: { status: "PLANNED" },
  });
  expect(reverted.ok()).toBe(true);
  const revertedBody = await reverted.json();
  expect(revertedBody.completedAt).toBeNull();
});

test("허용되지 않은 상태 전이는 409를 반환한다", async ({ request }) => {
  const created = await request.post("/api/assignments", {
    data: { date: "2026-07-29", type: "DIARY", title: "__e2e_status_invalid__" },
  });
  const createdBody = await created.json();
  assignmentIds.push(createdBody.id);

  await request.patch(`/api/assignments/${createdBody.id}/status`, { data: { status: "DONE" } });
  const invalid = await request.patch(`/api/assignments/${createdBody.id}/status`, {
    data: { status: "IN_PROGRESS" },
  });
  expect(invalid.status()).toBe(409);
});

test("상태 변경 요청에 status 외 필드가 섞이면 400을 반환한다", async ({ request }) => {
  const created = await request.post("/api/assignments", {
    data: { date: "2026-07-29", type: "DIARY", title: "__e2e_status_extra_field__" },
  });
  const createdBody = await created.json();
  assignmentIds.push(createdBody.id);

  const response = await request.patch(`/api/assignments/${createdBody.id}/status`, {
    data: { status: "DONE", title: "몰래 바꾸기" },
  });
  expect(response.status()).toBe(400);
});

test("존재하지 않는 과제의 상태를 변경하면 404를 반환한다", async ({ request }) => {
  const response = await request.patch("/api/assignments/999999/status", {
    data: { status: "DONE" },
  });
  expect(response.status()).toBe(404);
});
