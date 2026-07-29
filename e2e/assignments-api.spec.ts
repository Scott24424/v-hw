import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

// beforeAll은 이 파일을 실행하는 워커마다 한 번씩 돌기 때문에, 병렬 워커가
// 여러 개면 고정 제목의 Book을 동시에 만들려다 unique 제약에 걸린다.
// 파일 전체를 한 워커에서 순서대로 실행해 beforeAll이 정확히 한 번만 돌게 한다.
test.describe.configure({ mode: "serial" });

const prisma = new PrismaClient();

let bookId: number | undefined;

test.beforeAll(async ({ request }) => {
  const response = await request.post("/api/books", {
    data: { title: "__e2e_test_book__", language: "EN" },
  });
  const book = await response.json();
  bookId = book.id;
});

test.afterAll(async () => {
  await prisma.assignment.deleteMany({
    where: { OR: [{ bookId }, { title: { contains: "e2e" } }] },
  });
  if (bookId !== undefined) {
    await prisma.book.delete({ where: { id: bookId } });
  }
  await prisma.$disconnect();
});

test("READING 과제를 두 번 연속 생성하면 progressStart가 이전 progressEnd+1로 자동으로 이어진다", async ({
  request,
}) => {
  const first = await request.post("/api/assignments", {
    data: {
      date: "2026-07-29",
      type: "READING",
      title: "e2e book ch.6",
      bookId,
      progressUnit: "CHAPTER",
      progressEnd: 6,
    },
  });
  expect(first.ok()).toBe(true);
  const firstBody = await first.json();
  expect(firstBody.progressStart).toBe(1);
  expect(firstBody.progressEnd).toBe(6);

  const second = await request.post("/api/assignments", {
    data: {
      date: "2026-07-30",
      type: "READING",
      title: "e2e book ch.12",
      bookId,
      progressUnit: "CHAPTER",
      progressEnd: 12,
    },
  });
  expect(second.ok()).toBe(true);
  const secondBody = await second.json();
  expect(secondBody.progressStart).toBe(7);
});

test("잘못된 bookId로 READING 과제를 생성하면 400을 반환한다", async ({ request }) => {
  const response = await request.post("/api/assignments", {
    data: {
      date: "2026-07-29",
      type: "READING",
      title: "존재하지 않는 책",
      bookId: 999_999,
      progressUnit: "CHAPTER",
      progressEnd: 1,
    },
  });
  expect(response.status()).toBe(400);
});

test("규칙 위반 페이로드는 400과 함께 검증 오류를 반환한다", async ({ request }) => {
  const response = await request.post("/api/assignments", {
    data: {
      date: "2026-07-29",
      type: "DIARY",
      title: "일기",
      bookId: 1,
    },
  });
  expect(response.status()).toBe(400);
});

test("생성한 과제가 목록 조회에 isOverdue 필드와 함께 나타난다", async ({ request }) => {
  await request.post("/api/assignments", {
    data: {
      date: "2020-01-01",
      type: "DIARY",
      title: "e2e overdue diary",
    },
  });

  const response = await request.get("/api/assignments?from=2020-01-01&to=2020-01-01");
  expect(response.ok()).toBe(true);
  const body = await response.json();
  expect(body.length).toBeGreaterThan(0);
  expect(body[0]).toHaveProperty("isOverdue", true);
});
