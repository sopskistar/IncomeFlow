import { test, expect } from "@playwright/test";
test("Passport empty state, malformed request and bounded verification endpoint", async ({
  page,
  request,
}) => {
  await page.goto("/passport");
  await expect(
    page.getByRole("heading", { name: "Payment Passport", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Your work deserves a clear record."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Export backup" }),
  ).toBeDisabled();
  await page.goto("/pay#tampered");
  await expect(page.locator("main").getByRole("alert")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Pay test ifUSD", exact: true }),
  ).toHaveCount(0);
  const invalid = await request.post("/api/passport/verify", {
    data: { version: 99 },
  });
  expect(invalid.status()).toBe(422);
  const huge = await request.post("/api/passport/verify", {
    data: "x".repeat(50001),
    headers: { "content-type": "application/json" },
  });
  expect(huge.status()).toBe(413);
});
test("Passport navigation and error states fit desktop, tablet and narrow phones", async ({
  page,
}) => {
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/passport");
    await expect(
      page.getByRole("heading", { name: "Payment Passport", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.goto("/pay#bad");
    await expect(page.locator("main").getByRole("alert")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test('real signed request independently verifies both payments and client receipt',async({page})=>{
 await page.goto('/passport-demo');
 await expect(page.getByText('Owner-signed request verified',{exact:true})).toBeVisible({timeout:90000});
 await expect(page.locator('.passport-summary')).toContainText('100 ifUSD');
 await expect(page.locator('.passport-summary')).toContainText('0 ifUSD');
 await expect(page.getByText('Allocation confirmed',{exact:true})).toHaveCount(2);
 await expect(page.getByText('Policy at execution: version 1',{exact:true})).toHaveCount(0);
 await page.getByText('Share request and client receipt',{exact:true}).click();
 const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Export client receipt'}).click();
 expect((await downloaded).suggestedFilename()).toContain('client-receipt');
 await page.reload();await expect(page.getByText('Owner-signed request verified',{exact:true})).toBeVisible({timeout:90000});
});
test('public full Passport keeps actual allocation details available without pretending wallet ownership',async({page})=>{
 await page.goto('/passport-demo?view=owner');
 await expect(page.getByText('Owner-signed request verified',{exact:true})).toBeVisible({timeout:90000});
 await expect(page.getByText('Policy at execution: version 1',{exact:true})).toHaveCount(2);
 await expect(page.getByRole('link',{name:'Verified Reactive execution',exact:true})).toHaveCount(2);
 await expect(page.getByRole('button',{name:'Review payment association'})).toHaveCount(0);
});
