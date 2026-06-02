import { test, expect } from "@playwright/test";

async function login(page, uid, password = "Password1!") {
    await page.goto("http://localhost:5173/login");

    await page.getByPlaceholder("UID").fill(uid);
    await page.getByPlaceholder("Password").fill(password);

    await page.getByRole("button", { name: /^log in$/i }).click();
}

test("user can view class-only and class-time matches", async ({ page }) => {
    await login(page, "000000001", "Password1!");

    await expect(page).toHaveURL(/home/);

    await page.goto("http://localhost:5173/matches");

    await expect(
        page.getByRole("heading", { name: /study matches/i })).toBeVisible();

    // Page starts on Class Only mode
    await expect(page.getByText(/Matching Mode: Class Only/i)).toBeVisible();

    // At least one match card should be visible
    await expect(page.locator(".match-card").first()).toBeVisible();

    // Match cards should show shared class information
    await expect(page.getByText(/Shared classes:/i).first()).toBeVisible();

    // CS35L should appear as a shared class
    await expect(page.getByText(/CS35L/i).first()).toBeVisible();

    // Match cards should have a Message button
    await expect(page.getByRole("button", { name: /message/i }).first()).toBeVisible();

    // Switch to Class + Time mode
    await page.getByRole("button", { name: /class \+ time/i }).click();

    await expect(page.getByText(/Matching Mode: Class \+ Availability/i)).toBeVisible();
});