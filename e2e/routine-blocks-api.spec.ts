import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

// beforeAll/afterAll이 파일당 워커마다 한 번씩 돌기 때문에 (자세한 이유는
// docs/decisions.md 참조), DB 상태를 공유하는 이 파일은 한 워커에서 순서대로 실행한다.
test.describe.configure({ mode: "serial" });

const prisma = new PrismaClient();
const createdIds: number[] = [];

test.afterAll(async () => {
  await prisma.routineBlock.deleteMany({ where: { id: { in: createdIds } } });
  await prisma.$disconnect();
});

test("시간표 블록을 등록하면 목록 조회에 나타난다", async ({ request }) => {
  const created = await request.post("/api/routine-blocks", {
    data: { startMinute: 450, endMinute: 480, label: "__e2e_block_api__" },
  });
  expect(created.status()).toBe(201);
  const createdBody = await created.json();
  createdIds.push(createdBody.id);
  expect(createdBody.category).toBe("STUDY");
  expect(createdBody.isActive).toBe(true);

  const list = await request.get("/api/routine-blocks");
  expect(list.ok()).toBe(true);
  const blocks = await list.json();
  expect(blocks.some((block: { id: number }) => block.id === createdBody.id)).toBe(true);
});

test("startMinute이 endMinute보다 크거나 같으면 400을 반환한다", async ({ request }) => {
  const response = await request.post("/api/routine-blocks", {
    data: { startMinute: 600, endMinute: 480, label: "__e2e_block_invalid__" },
  });
  expect(response.status()).toBe(400);
});

test("시간표 블록을 부분 수정할 수 있다", async ({ request }) => {
  const created = await request.post("/api/routine-blocks", {
    data: { startMinute: 600, endMinute: 660, label: "__e2e_block_api_patch__" },
  });
  const createdBody = await created.json();
  createdIds.push(createdBody.id);

  const patched = await request.patch(`/api/routine-blocks/${createdBody.id}`, {
    data: { isActive: false },
  });
  expect(patched.ok()).toBe(true);
  const patchedBody = await patched.json();
  expect(patchedBody.isActive).toBe(false);
  expect(patchedBody.label).toBe("__e2e_block_api_patch__");
});

test("존재하지 않는 시간표 블록을 수정하면 404를 반환한다", async ({ request }) => {
  const response = await request.patch("/api/routine-blocks/999999", {
    data: { isActive: false },
  });
  expect(response.status()).toBe(404);
});

test("시간표 블록을 삭제하면 목록에서 사라진다", async ({ request }) => {
  const created = await request.post("/api/routine-blocks", {
    data: { startMinute: 660, endMinute: 690, label: "__e2e_block_api_delete__" },
  });
  const createdBody = await created.json();

  const deleted = await request.delete(`/api/routine-blocks/${createdBody.id}`);
  expect(deleted.status()).toBe(204);

  const list = await request.get("/api/routine-blocks");
  const blocks = await list.json();
  expect(blocks.some((block: { id: number }) => block.id === createdBody.id)).toBe(false);
});

test("존재하지 않는 시간표 블록을 삭제하면 404를 반환한다", async ({ request }) => {
  const response = await request.delete("/api/routine-blocks/999999");
  expect(response.status()).toBe(404);
});
