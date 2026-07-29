import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

// beforeAll은 이 파일을 실행하는 워커마다 한 번씩 돌기 때문에, 병렬 워커가
// 여러 개면 고정 제목의 Book을 동시에 만들려다 unique 제약에 걸린다.
// 파일 전체를 한 워커에서 순서대로 실행해 beforeAll이 정확히 한 번만 돌게 한다.
test.describe.configure({ mode: "serial" });

const prisma = new PrismaClient();

let bookId: number | undefined;
const assignmentIds: number[] = [];

test.beforeAll(async ({ request }) => {
  const response = await request.post("/api/books", {
    data: { title: "__e2e_test_book__", language: "EN" },
  });
  const book = await response.json();
  bookId = book.id;
});

test.afterAll(async () => {
  // 다른 spec 파일도 "e2e"가 포함된 assignment 제목을 쓰기 시작하면서
  // (docs/decisions.md 참조) title contains "e2e" 필터가 병렬 워커에서 그 파일의
  // 아직 사용 중인 행까지 지워버리는 문제가 있었다. 이 파일이 만든 id만 정확히 지운다.
  await prisma.assignment.deleteMany({ where: { id: { in: assignmentIds } } });
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
  assignmentIds.push(firstBody.id);
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
  assignmentIds.push(secondBody.id);
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
  const created = await request.post("/api/assignments", {
    data: {
      date: "2020-01-01",
      type: "DIARY",
      title: "e2e overdue diary",
    },
  });
  const createdBody = await created.json();
  assignmentIds.push(createdBody.id);

  const response = await request.get("/api/assignments?from=2020-01-01&to=2020-01-01");
  expect(response.ok()).toBe(true);
  const body = await response.json();
  expect(body.length).toBeGreaterThan(0);
  expect(body[0]).toHaveProperty("isOverdue", true);
});
