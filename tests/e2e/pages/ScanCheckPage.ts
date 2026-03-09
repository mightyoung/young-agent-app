import { Page, Locator, expect } from '@playwright/test';

export class ScanCheckPage {
  readonly page: Page;
  readonly headerTitle: Locator;
  readonly scanButton: Locator;
  readonly inputField: Locator;
  readonly searchButton: Locator;
  readonly hintTexts: Locator;

  constructor(page: Page) {
    this.page = page;
    this.headerTitle = page.getByText('扫码检查');
    this.scanButton = page.getByText('点击扫描二维码');
    this.inputField = page.getByPlaceholder('请输入或扫描设备二维码');
    this.searchButton = page.getByRole('button', { name: '搜索' });
    this.hintTexts = page.getByText('测试设备编号：');
  }

  async expectVisible() {
    await expect(this.headerTitle).toBeVisible();
    await expect(this.scanButton).toBeVisible();
  }

  async searchDevice(deviceId: string) {
    await this.inputField.fill(deviceId);
    await this.searchButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async expectDeviceFound() {
    // Should navigate to inspection detail
    await expect(this.page.getByText('检查详情').or(this.page.getByText('基本信息'))).toBeVisible({ timeout: 5000 });
  }
}
