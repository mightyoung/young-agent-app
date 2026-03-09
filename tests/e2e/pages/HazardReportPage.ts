import { Page, Locator, expect } from '@playwright/test';

export class HazardReportPage {
  readonly page: Page;
  readonly headerTitle: Locator;
  readonly addPhotoButton: Locator;
  readonly typeButtons: Locator;
  readonly locationInput: Locator;
  readonly descriptionInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.headerTitle = page.getByText('隐患随手拍');
    this.addPhotoButton = page.locator('[class*="addPhoto"]');
    this.typeButtons = page.locator('[class*="typeButton"]');
    this.locationInput = page.getByPlaceholder('请输入位置');
    this.descriptionInput = page.getByPlaceholder('请描述安全隐患');
    this.submitButton = page.getByRole('button', { name: '提交' });
  }

  async expectVisible() {
    await expect(this.headerTitle).toBeVisible();
  }

  async selectHazardType(typeName: string) {
    await this.page.getByText(typeName).click();
  }

  async fillDescription(description: string) {
    await this.descriptionInput.fill(description);
  }

  async fillLocation(location: string) {
    await this.locationInput.fill(location);
  }

  async submit() {
    await this.submitButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async expectSubmitSuccess() {
    await expect(this.page.getByText('上报成功')).toBeVisible({ timeout: 10000 });
  }
}
