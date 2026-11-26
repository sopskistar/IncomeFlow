import { test, expect } from "@playwright/test";
test("landing calculator is labeled and does not impersonate a payment", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Give every payment a purpose." }),
  ).toBeVisible();
  await expect(page.getByText("Illustration only")).toBeVisible();
  await page.getByLabel("Illustrative payment amount").fill("100");
  await expect(
    page.locator(".preview-allocations").getByText("50", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Organize your income" }).click();
  await expect(
    page.getByRole("heading", { name: "Create your vault" }),
  ).toBeVisible();
});
test("disconnected workspace and invalid existing-vault input", async ({
  page,
}) => {
  await page.goto("/app");
  await expect(
    page.getByRole("button", { name: "Create or resume setup" }),
  ).toHaveCount(0);
  await page.getByLabel("Already have an IncomeFlow vault?").fill("invalid");
  await page.getByRole("button", { name: "Open", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "valid vault address",
  );
});
test("reads actual demo policy and full confirmed receipt", async ({
  page,
}) => {
  await page.goto("/app?vault=demo");
  await expect(page.getByText("1 confirmed payment")).toBeVisible({
    timeout: 90_000,
  });
  await expect(page.getByText("Read only", { exact: true })).toBeVisible();
  await page
    .getByRole("navigation", { name: "Workspace" })
    .getByRole("link", { name: "Activity" })
    .click();
  await page.locator(".payment-row>summary").first().click();
  await expect(
    page.getByRole("link", { name: "Authenticated callback and payouts" }),
  ).toBeVisible();
  await expect(page.getByText("Actual recipient transfers")).toBeVisible();
  await page.getByText("Advanced receipt details", { exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download receipt" }).click();
  expect((await download).suggestedFilename()).toMatch(/incomeflow-.*json/);
});
test("read-only allocation editor previews real rules and exact totals", async ({
  page,
}) => {
  await page.goto("/app?vault=demo&view=rules");
  await expect(
    page.getByRole("heading", { name: "Make your income plan." }),
  ).toBeVisible({ timeout: 90_000 });
  await expect(
    page.getByRole("button", { name: "Save allocation rules" }),
  ).toBeDisabled();
  await page.getByLabel("Destination 1 percentage").fill("49.99");
  await expect(page.getByText("Total 99.99% / 100%")).toBeVisible();
  await page.getByRole("button", { name: "Add destination" }).click();
  await expect(page.getByLabel("Destination 4 wallet")).toBeVisible();
  await page.getByRole("button", { name: "Remove destination 4" }).click();
  await expect(page.getByLabel("Destination 4 wallet")).toHaveCount(0);
  await page
    .getByRole("navigation", { name: "Workspace" })
    .getByRole("link", { name: "Receive", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Workspace" })
    .getByRole("link", { name: "Rules", exact: true })
    .click();
  await expect(page.getByLabel("Destination 1 percentage")).toHaveValue(
    "49.99",
  );
  await page.reload();
  await expect(page.getByLabel("Destination 1 percentage")).toHaveValue(
    "49.99",
  );
  await page.getByRole("button", { name: "Discard draft" }).click();
  await expect(page.getByLabel("Destination 1 percentage")).toHaveValue("50");
});
test("RPC failure is explicit and never shown as a confirmed payment", async ({
  page,
}) => {
  await page.route("**/api/vault/**", (r) =>
    r.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: "Test fixture: RPC unavailable. Refresh to retry.",
      }),
    }),
  );
  await page.goto("/app?vault=demo");
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "RPC unavailable",
  );
  await expect(
    page.getByText("Distribution confirmed", { exact: true }),
  ).toHaveCount(0);
});
test("keyboard focus, reduced motion and help navigation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "Help" })
    .click();
  await page
    .getByText("My payment arrived but has not been allocated.")
    .click();
  await expect(
    page.getByText(
      "Subscription resume does not guarantee replay of missed origin events.",
      { exact: false },
    ),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
  ).toBe("auto");
});
for (const width of [1440, 768, 390, 320])
  test(`responsive layout stays within ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/app", "/proof", "/help"]) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      expect(overflow, route).toBe(false);
      if (route === "/app") {
        await page.evaluate(() => document.fonts.ready);
        expect(
          await page
            .locator(".workspace-tabs")
            .evaluate((el) => el.scrollWidth <= el.clientWidth),
        ).toBe(true);
      }
    }
  });

test("paused, underfunded and indebted health states are explicit (isolated fixture)", async ({ page, request }) => {
  // Presentation-only fixture derived from public state. Never live proof or a sent transaction.
  const response = await request.get("/api/vault/0x361890c8550548bB5c1A2C40e009470a259cf41E");
  expect(response.ok()).toBe(true);
  const data = await response.json();
  data.paused = true;
  data.health.vaultBalance = "0";
  data.health.vaultReserves = "0";
  data.health.reactiveDebt = "1";
  await page.route("**/api/vault/**", route => route.fulfill({json: data}));
  await page.goto("/app?vault=demo&view=health");
  await expect(page.getByText("Allocations are paused.", {exact:true})).toBeVisible();
  await expect(page.getByText("Funding needed", {exact:true})).toBeVisible();
  await expect(page.getByText("Outstanding fees", {exact:true})).toBeVisible();
  await expect(page.getByText("Automation has outstanding fees.", {exact:false})).toBeVisible();
  await expect(page.getByRole("button", {name:"Resume allocations",exact:true})).toBeDisabled();
});

test("production API rejects malformed address and history cursor", async ({request}) => {
  expect((await request.get("/api/vault/not-an-address")).status()).toBe(400);
  expect((await request.get("/api/vault/0x361890c8550548bB5c1A2C40e009470a259cf41E?before=-1")).status()).toBe(400);
});


test("calculator waits for hydration before accepting edits", async ({page}) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/_next/static/**/*.js", async route => { await gate; await route.continue(); });
  try {
    await page.goto("/", {waitUntil:"commit"});
    const amount = page.getByLabel("Illustrative payment amount");
    await expect(amount).toBeDisabled();
    release();
    await expect(amount).toBeEnabled();
    await amount.fill("100");
    await expect(page.locator(".preview-allocations").getByText("50",{exact:true})).toBeVisible();
  } finally { release(); }
});
