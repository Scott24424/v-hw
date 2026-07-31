import { PrismaClient } from "@prisma/client";
import { expect, test } from "@playwright/test";

// "/manage/routine"은 전체 RoutineBlock 목록을 보여주는 화면이라 다른 spec 파일
// (routine-blocks-api.spec.ts 등)이 병렬로 만드는 블록과 같은 화면에 섞일 수 있다.
// 그래서 각 테스트가 만든 블록만 고유한 라벨로 식별해 검증한다. "이름" input이
// 상단 "블록 추가" 폼과 각 행의 인라인 수정 폼에 동시에 여러 개 있을 수 있어,
// hasText로 행을 찾을 때는 값이 아직 텍스트로 보이는 "보기" 모드에서만 사용하고,
// 수정 모드로 전환한 뒤에는 구조적 위치(ul > li)로 다시 잡는다.
test.describe.configure({ mode: "serial" });

const prisma = new PrismaClient();
const blockIds: number[] = [];

test.afterAll(async () => {
  await prisma.routineBlock.deleteMany({ where: { id: { in: blockIds } } });
  await prisma.$disconnect();
});

async function trackCreated(page: import("@playwright/test").Page, label: string) {
  const block = await prisma.routineBlock.findFirst({ where: { label } });
  if (block) blockIds.push(block.id);
  return block;
}

test("블록 추가 폼으로 새 블록을 만들면 목록에 나타난다", async ({ page }) => {
  await page.goto("/manage/routine");

  await page.locator('section:has-text("블록 추가") input[type="time"]').first().fill("07:30");
  await page.locator('section:has-text("블록 추가") input[type="time"]').nth(1).fill("08:00");
  await page.locator('section:has-text("블록 추가") input[type="text"]').fill("__e2e_manage_add__");

  const [response] = await Promise.all([
    page.waitForResponse(
      (res) => res.url().endsWith("/api/routine-blocks") && res.request().method() === "POST",
    ),
    page.getByRole("button", { name: "추가" }).click(),
  ]);
  expect(response.status()).toBe(201);
  await trackCreated(page, "__e2e_manage_add__");

  const row = page.locator("li", { hasText: "__e2e_manage_add__" });
  await expect(row.getByText("7:30 ~ 8:00")).toBeVisible();
});

test("시작이 종료보다 크거나 같으면 에러 메시지를 보여준다", async ({ page }) => {
  await page.goto("/manage/routine");

  await page.locator('section:has-text("블록 추가") input[type="time"]').first().fill("10:00");
  await page.locator('section:has-text("블록 추가") input[type="time"]').nth(1).fill("09:00");
  await page.locator('section:has-text("블록 추가") input[type="text"]').fill("__e2e_manage_invalid__");
  await page.getByRole("button", { name: "추가" }).click();

  await expect(page.getByText("startMinute은 endMinute보다 작아야 합니다")).toBeVisible();
  await expect(page.locator("li", { hasText: "__e2e_manage_invalid__" })).toHaveCount(0);
});

test("끄기/켜기 토글이 작동한다", async ({ page, request }) => {
  const created = await request.post("/api/routine-blocks", {
    data: { startMinute: 480, endMinute: 540, label: "__e2e_manage_toggle__" },
  });
  const createdBody = await created.json();
  blockIds.push(createdBody.id);

  await page.goto("/manage/routine");
  const row = page.locator("li", { hasText: "__e2e_manage_toggle__" });
  await expect(row.getByRole("button", { name: "끄기" })).toBeVisible();

  await row.getByRole("button", { name: "끄기" }).click();
  await expect(row.getByRole("button", { name: "켜기" })).toBeVisible();

  const afterOff = await request.get("/api/routine-blocks");
  const blockAfterOff = (await afterOff.json()).find(
    (b: { id: number }) => b.id === createdBody.id,
  );
  expect(blockAfterOff.isActive).toBe(false);
});

test("수정 폼으로 필드를 바꿀 수 있고, 취소하면 바뀌지 않는다", async ({ page, request }) => {
  const created = await request.post("/api/routine-blocks", {
    data: { startMinute: 540, endMinute: 600, label: "__e2e_manage_edit__" },
  });
  const createdBody = await created.json();
  blockIds.push(createdBody.id);

  await page.goto("/manage/routine");
  const rowByText = page.locator("li", { hasText: "__e2e_manage_edit__" });
  await rowByText.getByRole("button", { name: "수정" }).click();

  // 수정 모드 진입 후에는 라벨이 input value로 옮겨가 hasText가 못 잡을 수 있어
  // 구조적으로(ul > li 중 방금 열린 행) 다시 특정한다.
  const editingRow = page.locator("ul > li").filter({ has: page.getByRole("button", { name: "저장" }) });
  await editingRow.locator('input[type="text"]').fill("__e2e_manage_edited__");
  const [patchResponse] = await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes(`/api/routine-blocks/${createdBody.id}`) &&
        res.request().method() === "PATCH",
    ),
    editingRow.getByRole("button", { name: "저장" }).click(),
  ]);
  expect(patchResponse.status()).toBe(200);

  const afterEdit = await request.get(`/api/routine-blocks`);
  const edited = (await afterEdit.json()).find((b: { id: number }) => b.id === createdBody.id);
  expect(edited.label).toBe("__e2e_manage_edited__");

  // 취소 케이스: 다시 열어서 값을 바꾸다가 취소하면 서버에 반영되지 않는다.
  const rowAfterEdit = page.locator("li", { hasText: "__e2e_manage_edited__" });
  await rowAfterEdit.getByRole("button", { name: "수정" }).click();
  const editingRow2 = page.locator("ul > li").filter({ has: page.getByRole("button", { name: "저장" }) });
  await editingRow2.locator('input[type="text"]').fill("__e2e_manage_should_not_save__");
  await editingRow2.getByRole("button", { name: "취소" }).click();

  const afterCancel = await request.get(`/api/routine-blocks`);
  const stillEdited = (await afterCancel.json()).find(
    (b: { id: number }) => b.id === createdBody.id,
  );
  expect(stillEdited.label).toBe("__e2e_manage_edited__");
});

test("삭제 버튼은 확인을 거쳐 물리 삭제하고 목록에서 사라진다", async ({ page, request }) => {
  const created = await request.post("/api/routine-blocks", {
    data: { startMinute: 600, endMinute: 660, label: "__e2e_manage_delete__" },
  });
  const createdBody = await created.json();

  await page.goto("/manage/routine");
  page.once("dialog", (dialog) => dialog.accept());

  const row = page.locator("li", { hasText: "__e2e_manage_delete__" });
  const [deleteResponse] = await Promise.all([
    page.waitForResponse(
      (res) =>
        res.url().includes(`/api/routine-blocks/${createdBody.id}`) &&
        res.request().method() === "DELETE",
    ),
    row.getByRole("button", { name: "삭제" }).click(),
  ]);
  expect(deleteResponse.status()).toBe(204);

  const list = await request.get("/api/routine-blocks");
  const body = await list.json();
  expect(body.some((b: { id: number }) => b.id === createdBody.id)).toBe(false);
});

test("/schedule에 시간표 관리로 가는 링크가 있고, 관리 화면에는 시간표로 돌아가는 링크가 있다", async ({
  page,
}) => {
  await page.goto("/schedule");
  await page.getByRole("link", { name: "시간표 관리 →" }).click();
  await expect(page).toHaveURL(/\/manage\/routine$/);

  await page.getByRole("link", { name: "← 시간표로" }).click();
  await expect(page).toHaveURL(/\/schedule$/);
});
