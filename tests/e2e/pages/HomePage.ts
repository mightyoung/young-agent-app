import { Page, Locator, expect } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly greeting: Locator;
  readonly scanCard: Locator;
  readonly hazardCard: Locator;
  readonly safetyCard: Locator;
  readonly quickLinks: Locator;
  readonly notificationButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.greeting = page.getByText(/你好/);
    this.scanCard = page.getByText('扫码检查');
    this.hazardCard = page.getByText('隐患随手拍');
    this.safetyCard = page.getByText('安全检查');
    this.quickLinks = page.locator('*[text*="检查历史"], *[text*="隐患记录"], *[text*="设备台账"]');
    this.notificationButton = page.locator('[class*="notification"]');
  }

  async expectVisible() {
    await expect(this.greeting).toBeVisible();
    await expect(this.scanCard).toBeVisible();
    await expect(this.hazardCard).toBeVisible();
    await expect(this.safetyCard).toBeVisible();
  }

  async goToScanCheck() {
    await this.scanCard.click();
    await this.page.waitForLoadState('networkidle');
  }

  async goToHazardReport() {
    await this.hazardCard.click();
    await this.page.waitForLoadState('networkidle');
  }

  async goToSafetyCheck() {
    await this.safetyCard.click();
    await this.page.waitForLoadState('networkidle');
  }

  async goToInspectionHistory() {
    await this.page.getByText('检查历史').click();
    await this.page.waitForLoadState('networkidle');
  }

  async goToHazardList() {
    await this.page.getByText('隐患记录').click();
    await this.page.waitForLoadState('networkidle');
  }

  async goToDeviceList() {
    await this.page.getByText('设备台账').click();
    await this.page.waitForLoadState('networkidle');
  }

  async goToMessages() {
    await this.notificationButton.click();
    await this.page.waitForLoadState('networkidle');
  }
}
