import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { AIAssistantPage } from '../pages/AIAssistantPage';
import { DataCenterPage } from '../pages/DataCenterPage';

test.describe('AI & Data Features', () => {
  let loginPage: LoginPage;
  let homePage: HomePage;
  let aiPage: AIAssistantPage;
  let dataCenterPage: DataCenterPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    homePage = new HomePage(page);
    aiPage = new AIAssistantPage(page);
    dataCenterPage = new DataCenterPage(page);

    // Login first
    await loginPage.goto();
    await loginPage.login('admin', 'admin123');
    await homePage.expectVisible();
  });

  test.describe('AI Assistant', () => {
    test('should navigate to AI tab', async ({ page }) => {
      // Click on AI tab (second tab)
      await page.getByText('AI助手').nth(1).click();
      await page.waitForTimeout(1000);
      await aiPage.expectVisible();
    });

    test('should display quick actions', async ({ page }) => {
      await page.getByText('AI助手').nth(1).click();
      await page.waitForTimeout(1000);
      await expect(page.getByText('查询设备')).toBeVisible();
      await expect(page.getByText('本周任务')).toBeVisible();
      await expect(page.getByText('知识库')).toBeVisible();
      await expect(page.getByText('隐患统计')).toBeVisible();
    });

    test('should send message and receive response', async ({ page }) => {
      await page.getByText('AI助手').nth(1).click();
      await page.waitForTimeout(1000);
      await aiPage.sendMessage('测试问题');
      await aiPage.expectResponse();
    });
  });

  test.describe('Data Center', () => {
    test('should navigate to Data Center', async ({ page }) => {
      await page.getByText('AI助手').nth(1).click();
      await page.waitForTimeout(1000);
      // Click on Data Center tab
      await page.getByText('数据中心').click();
      await page.waitForTimeout(1000);
      await dataCenterPage.expectVisible();
    });

    test('should display stats', async ({ page }) => {
      await page.getByText('AI助手').nth(1).click();
      await page.waitForTimeout(1000);
      await page.getByText('数据中心').click();
      await page.waitForTimeout(1000);
      await expect(page.getByText('设备总数')).toBeVisible();
      await expect(page.getByText('正常')).toBeVisible();
      await expect(page.getByText('警告')).toBeVisible();
    });

    test('should display device list', async ({ page }) => {
      await page.getByText('AI助手').nth(1).click();
      await page.waitForTimeout(1000);
      await page.getByText('数据中心').click();
      await page.waitForTimeout(1000);
      const count = await dataCenterPage.getDeviceCount();
      expect(count).toBeGreaterThan(0);
    });
  });
});
