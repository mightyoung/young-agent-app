import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';

test.describe('Navigation', () => {
  let loginPage: LoginPage;
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    homePage = new HomePage(page);

    await loginPage.goto();
    await loginPage.login('admin', 'admin123');
    await homePage.expectVisible();
  });

  test('should have 2 main tabs', async ({ page }) => {
    await expect(page.getByText('首页')).toBeVisible();
    await expect(page.getByText('AI助手').nth(1)).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    // On home tab
    await expect(homePage.scanCard).toBeVisible();

    // Switch to AI tab
    await page.getByText('AI助手').nth(1).click();
    await page.waitForTimeout(1000);

    // Should see AI assistant
    await expect(page.getByText('请输入您的问题...')).toBeVisible();

    // Switch back to home tab
    await page.getByText('首页').click();
    await page.waitForTimeout(1000);

    // Should see home again
    await expect(homePage.scanCard).toBeVisible();
  });

  test.describe('AI Tab sub-navigation', () => {
    test('should have AI Assistant, Data Center, Profile tabs', async ({ page }) => {
      await page.getByText('AI助手').nth(1).click();
      await page.waitForTimeout(1000);

      // Should see bottom tabs within AI section
      await expect(page.getByText('AI助手').first()).toBeVisible();
      await expect(page.getByText('数据中心')).toBeVisible();
      await expect(page.getByText('个人中心')).toBeVisible();
    });

    test('should navigate to Data Center from AI tab', async ({ page }) => {
      await page.getByText('AI助手').nth(1).click();
      await page.waitForTimeout(1000);
      await page.getByText('数据中心').click();
      await page.waitForTimeout(1000);
      await expect(page.getByText('设备总数')).toBeVisible();
    });

    test('should navigate to Profile from AI tab', async ({ page }) => {
      await page.getByText('AI助手').nth(1).click();
      await page.waitForTimeout(1000);
      await page.getByText('个人中心').click();
      await page.waitForTimeout(1000);
      await expect(page.getByText('我的台账')).toBeVisible();
    });
  });
});
