import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

// beforeAll/afterAll이 파일당 워커마다 한 번씩 돌기 때문에 (자세한 이유는
// docs/decisions.md 참조), DB 상태를 공유하는 이 파일은 한 워커에서 순서대로 실행한다.
test.describe.configure({ mode: "serial" });

const prisma = new PrismaClient();
const createdIds: number[] = [];

test.afterAll(async () => {
  await prisma.book.deleteMany({ where: { id: { in: createdIds } } });
  await prisma.$disconnect();
});

test("책을 등록하면 목록 조회에 나타난다", async ({ request }) => {
  const created = await request.post("/api/books", {
    data: { title: "__e2e_book_api__", language: "EN", totalChapters: 20 },
  });
  expect(created.status()).toBe(201);
  const createdBody = await created.json();
  createdIds.push(createdBody.id);

  const list = await request.get("/api/books");
  expect(list.ok()).toBe(true);
  const books = await list.json();
  expect(books.some((book: { id: number }) => book.id === createdBody.id)).toBe(true);
});

test("같은 제목·언어로 중복 등록하면 409를 반환한다", async ({ request }) => {
  const first = await request.post("/api/books", {
    data: { title: "__e2e_book_api_dup__", language: "KO" },
  });
  expect(first.status()).toBe(201);
  const firstBody = await first.json();
  createdIds.push(firstBody.id);

  const duplicate = await request.post("/api/books", {
    data: { title: "__e2e_book_api_dup__", language: "KO" },
  });
  expect(duplicate.status()).toBe(409);
});

test("규칙 위반 페이로드(title 없음)는 400을 반환한다", async ({ request }) => {
  const response = await request.post("/api/books", {
    data: { language: "EN" },
  });
  expect(response.status()).toBe(400);
});

test("책 정보를 부분 수정할 수 있다", async ({ request }) => {
  const created = await request.post("/api/books", {
    data: { title: "__e2e_book_api_patch__", language: "EN" },
  });
  const createdBody = await created.json();
  createdIds.push(createdBody.id);

  const patched = await request.patch(`/api/books/${createdBody.id}`, {
    data: { totalPages: 217 },
  });
  expect(patched.ok()).toBe(true);
  const patchedBody = await patched.json();
  expect(patchedBody.totalPages).toBe(217);
  expect(patchedBody.title).toBe("__e2e_book_api_patch__");
});

test("존재하지 않는 책을 수정하면 404를 반환한다", async ({ request }) => {
  const response = await request.patch("/api/books/999999", {
    data: { totalPages: 1 },
  });
  expect(response.status()).toBe(404);
});
