import { Page, Locator, expect } from '@playwright/test';

export class DataCenterPage {
  readonly page: Page;
  readonly headerTitle: Locator;
  readonly statsCards: Locator;
  readonly deviceList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.headerTitle = page.getByText('数据中心');
    this.statsCards = page.locator('[class*="statCard"]');
    this.deviceList = page.locator('[class*="card"]');
  }

  async expectVisible() {
    await expect(this.headerTitle).toBeVisible();
  }

  async getDeviceCount(): Promise<number> {
    return await this.deviceList.count();
  }

  async clickDevice(index: number) {
    await this.deviceList.nth(index).click();
    await this.page.waitForLoadState('networkidle');
  }

  async expectDeviceDetail() {
    await expect(this.page.getByText('设备详情').or(this.page.getByText('基本信息'))).toBeVisible({ timeout: 5000 });
  }
}
