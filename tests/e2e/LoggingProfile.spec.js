import { test, expect } from '@playwright/test';

test('valid login and profile update', async ({ page }) => {

    // Login
    await page.goto('http://localhost:5173/login');

    await page.getByPlaceholder('UID').fill('000000001');
    await page.getByPlaceholder('Password').fill('Password1!');

    await page.getByRole('button', { name: 'Log In' }).click();

    // Verify login worked
    await expect(page.getByText(/Welcome/i)).toBeVisible();

    // Open profile page
    await page.goto("http://localhost:5173/profile");

    // Verify profile page loaded
    await expect(page.getByText(/Current Classes/i)).toBeVisible();

    // Add class
    await page.getByPlaceholder(/class name/i).fill('CS32');

    await page.getByPlaceholder(/professor name/i).fill('Smallberg');

    await page.getByRole('button', { name: /Add Class/i }).click();

    // Verify class appears
    await expect(page.getByText('CS32')).toBeVisible();

    // Add availability
    const inputs = page.locator("input");

    const mondayStart = inputs.nth(2);
    const mondayEnd = inputs.nth(3);

    await mondayStart.fill("09:00");
    await mondayEnd.fill("11:00");

    await expect(mondayStart).toHaveValue("09:00");
    await expect(mondayEnd).toHaveValue("11:00");
});