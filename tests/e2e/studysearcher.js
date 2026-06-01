const { test, expect } = require("@playwright/test");

function randomUID() {
  return String(Math.floor(100000000 + Math.random() * 900000000));
}

async function signup(page, uid, name = "Test User", password = "Password1!") {
  await page.goto("/signup");
  await page.getByPlaceholder("UID").fill(uid);
  await page.getByPlaceholder("Name").fill(name);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: /^sign up$/i }).click();
}

async function login(page, uid, password = "Password1!") {
  await page.goto("/login");
  await page.getByPlaceholder("UID").fill(uid);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: /^log in$/i }).click();
}

/* INVALID SIGNUP TESTS */

test("signup rejects non-9-digit UID", async ({ page }) => {
  await signup(page, "12345", "Bad UID", "Password1!");
  await expect(page.getByText(/UID must be exactly 9 digits/i)).toBeVisible();
});

test("signup rejects weak password", async ({ page }) => {
  await signup(page, randomUID(), "Weak Password", "password");
  await expect(page.getByText(/password must/i)).toBeVisible();
});

test("signup rejects already-used UID", async ({ page }) => {
  const uid = randomUID();

  await signup(page, uid, "First User", "Password1!");
  await expect(page.getByText(/account created successfully/i)).toBeVisible();

  await signup(page, uid, "Duplicate User", "Password1!");
  await expect(page.getByText(/UID already/i)).toBeVisible();
});

/* INVALID LOGIN TESTS */

test("login rejects non-9-digit UID", async ({ page }) => {
  await login(page, "12345", "Password1!");
  await expect(page.getByText(/UID must be exactly 9 digits/i)).toBeVisible();
});

test("login rejects nonexistent account", async ({ page }) => {
  await login(page, randomUID(), "Password1!");
  await expect(page.getByText(/invalid UID or password/i)).toBeVisible();
});

test("login rejects UID with wrong password", async ({ page }) => {
  const uid = randomUID();

  await signup(page, uid, "Wrong Password User", "Password1!");
  await expect(page.getByText(/account created successfully/i)).toBeVisible();

  await login(page, uid, "WrongPassword1!");
  await expect(page.getByText(/invalid UID or password/i)).toBeVisible();
});

/* VALID FLOW TESTS */

test("valid user can sign up, log in, and reach home", async ({ page }) => {
  const uid = randomUID();

  await signup(page, uid, "Valid User", "Password1!");
  await expect(page.getByText(/account created successfully/i)).toBeVisible();

  await login(page, uid, "Password1!");

  await expect(page).toHaveURL(/home/);
  await expect(page.getByText(/Welcome/i)).toBeVisible();
});

test("logged-in user can go to profile page and add class info", async ({ page }) => {
  const uid = randomUID();

  await signup(page, uid, "Profile User", "Password1!");
  await login(page, uid, "Password1!");

  await page.goto("/profile");

  await page.getByPlaceholder(/enter class name/i).fill("CS35L");
  await page.getByPlaceholder(/enter professor name/i).fill("Tobias");
  await page.getByRole("button", { name: /add class/i }).click();

  await expect(page.getByText(/CS35L/i)).toBeVisible();
  await expect(page.getByText(/Tobias/i)).toBeVisible();
});

test("logged-in user can open matches page and switch match modes", async ({ page }) => {
  const uid = randomUID();

  await signup(page, uid, "Matches User", "Password1!");
  await login(page, uid, "Password1!");

  await page.goto("/matches");

  await expect(page.getByRole("heading", { name: /study matches/i })).toBeVisible();

  await page.getByRole("button", { name: /class only/i }).click();
  await expect(page.getByText(/Matching Mode: Class Only/i)).toBeVisible();

  await page.getByRole("button", { name: /class \+ time/i }).click();
  await expect(page.getByText(/Matching Mode: Class \+ Time/i)).toBeVisible();
});