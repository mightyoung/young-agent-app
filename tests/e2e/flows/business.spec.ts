import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { ScanCheckPage } from '../pages/ScanCheckPage';
import { HazardReportPage } from '../pages/HazardReportPage';

test.describe('Business Flows', () => {
  let loginPage: LoginPage;
  let homePage: HomePage;
  let scanCheckPage: ScanCheckPage;
  let hazardReportPage: HazardReportPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    homePage = new HomePage(page);
    scanCheckPage = new ScanCheckPage(page);
    hazardReportPage = new HazardReportPage(page);

    // Login before each test
    await loginPage.goto();
    await loginPage.login('admin', 'admin123');
    await homePage.expectVisible();
  });

  test.describe('Home Screen', () => {
    test('should display all main actions', async () => {
      await expect(homePage.scanCard).toBeVisible();
      await expect(homePage.hazardCard).toBeVisible();
      await expect(homePage.safetyCard).toBeVisible();
    });

    test('should display quick links', async () => {
      await expect(homePage.page.getByText('检查历史')).toBeVisible();
      await expect(homePage.page.getByText('隐患记录')).toBeVisible();
      await expect(homePage.page.getByText('设备台账')).toBeVisible();
    });

    test('should navigate to quick links', async () => {
      await homePage.goToInspectionHistory();
      await expect(homePage.page.getByText('检查历史')).toBeVisible();

      await homePage.page.goBack();
      await homePage.expectVisible();

      await homePage.goToHazardList();
      await expect(homePage.page.getByText('隐患记录')).toBeVisible();

      await homePage.page.goBack();
      await homePage.expectVisible();

      await homePage.goToDeviceList();
      await expect(homePage.page.getByText('设备台账')).toBeVisible();
    });
  });

  test.describe('Scan Check Flow', () => {
    test('should navigate to scan check page', async () => {
      await homePage.goToScanCheck();
      await scanCheckPage.expectVisible();
    });

    test('should search device by ID', async () => {
      await homePage.goToScanCheck();
      await scanCheckPage.searchDevice('dev1_loc1_type1_dept1');
      // May navigate to inspection detail or show not found
      await scanCheckPage.page.waitForTimeout(1000);
    });

    test('should show hint for test devices', async () => {
      await homePage.goToScanCheck();
      await expect(scanCheckPage.hintTexts).toBeVisible();
      await expect(scanCheckPage.page.getByText('dev1_loc1_type1_dept1')).toBeVisible();
    });
  });

  test.describe('Hazard Report Flow', () => {
    test('should navigate to hazard report page', async () => {
      await homePage.goToHazardReport();
      await hazardReportPage.expectVisible();
    });

    test('should fill hazard form', async () => {
      await homePage.goToHazardReport();
      await hazardReportPage.selectHazardType('火灾安全隐患');
      await hazardReportPage.fillLocation('测试位置A区');
      await hazardReportPage.fillDescription('测试发现消防通道堵塞');
    });

    test('should show validation when submitting empty form', async () => {
      await homePage.goToHazardReport();
      await hazardReportPage.submit();
      // Should show alert or validation message
      await hazardReportPage.page.waitForTimeout(500);
    });

    test('should submit hazard successfully with description', async ({ page }) => {
      await homePage.goToHazardReport();
      await hazardReportPage.selectHazardType('火灾安全隐患');
      await hazardReportPage.fillDescription('测试发现消防通道堵塞');
      await hazardReportPage.submit();
      await hazardReportPage.expectSubmitSuccess();
    });
  });

  test.describe('Safety Check Flow', () => {
    test('should navigate to safety check page', async () => {
      await homePage.goToSafetyCheck();
      await expect(homePage.page.getByText('安全检查')).toBeVisible();
      await expect(homePage.page.getByText('选择检查任务')).toBeVisible();
    });

    test('should display task list', async () => {
      await homePage.goToSafetyCheck();
      await expect(homePage.page.getByText('月度消防检查')).toBeVisible();
      await expect(homePage.page.getByText('电气安全检查')).toBeVisible();
    });

    test('should have free check option', async () => {
      await homePage.goToSafetyCheck();
      await expect(homePage.page.getByText('自由检查')).toBeVisible();
    });
  });
});
