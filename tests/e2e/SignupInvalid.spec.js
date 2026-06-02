import { test, expect } from '@playwright/test';

test.describe('Invalid Signup Tests', () => {

  test('rejects UID that is not 9 digits', async ({ page }) => {
    await page.goto('http://localhost:5173/signup');

    await page.getByPlaceholder('UID').fill('12345');
    await page.getByPlaceholder('Name').fill('Test User');
    await page.getByPlaceholder('Password').fill('Password1!');

    await page.getByRole('button', { name: 'Sign Up' }).click();

    await expect(page.getByText('UID must be exactly 9 digits.')).toBeVisible();
    });

  test('rejects weak password', async ({ page }) => {
    await page.goto('http://localhost:5173/signup');

    await page.getByPlaceholder('UID').fill('120000063');
    await page.getByPlaceholder('Name').fill('Test User');
    await page.getByPlaceholder('Password').fill('password');

    await page.getByRole('button', { name: 'Sign Up' }).click();

    await expect(page.getByText(/Password must be at least 8 characters/i)).toBeVisible();
    });

  test('rejects duplicate UID', async ({ page }) => {
    await page.goto('http://localhost:5173/signup');

    await page.getByPlaceholder('UID').fill('000000001');
    await page.getByPlaceholder('Name').fill('Duplicate User');
    await page.getByPlaceholder('Password').fill('Password1!');

    await page.getByRole('button', { name: 'Sign Up' }).click();

    await expect(page.getByText(/existing account/i)).toBeVisible();
    });

});