import { expect, test } from "@playwright/test";

test("기본 페이지가 뜬다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "오늘" })).toBeVisible();
});
