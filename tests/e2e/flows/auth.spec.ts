import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';

test.describe('Authentication Flow', () => {
  let loginPage: LoginPage;
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    homePage = new HomePage(page);
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login('admin', 'admin123');
    await loginPage.expectLoginSuccess();
    await homePage.expectVisible();
  });

  test('should login successfully with inspector account', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login('inspector', 'inspector123');
    await loginPage.expectLoginSuccess();
    await homePage.expectVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login('admin', 'wrongpassword');
    await loginPage.expectLoginFailed();
  });

  test('should show error with empty credentials', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login('', '');
    // Should show validation error
    await expect(page.getByText('请输入用户名和密码')).toBeVisible();
  });

  test('should show hint account info on login page', async ({ page }) => {
    await loginPage.goto();
    await expect(loginPage.hintAccount).toBeVisible();
  });
});
