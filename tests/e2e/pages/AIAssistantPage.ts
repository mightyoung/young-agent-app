import { Page, Locator, expect } from '@playwright/test';

export class AIAssistantPage {
  readonly page: Page;
  readonly headerTitle: Locator;
  readonly inputBox: Locator;
  readonly sendButton: Locator;
  readonly quickActions: Locator;
  readonly chatArea: Locator;

  constructor(page: Page) {
    this.page = page;
    this.headerTitle = page.getByText('AI助手').first();
    this.inputBox = page.getByPlaceholder('请输入您的问题...');
    this.sendButton = page.locator('[class*="sendButton"]');
    this.quickActions = page.locator('[class*="quickAction"]');
    this.chatArea = page.locator('[class*="messageList"]');
  }

  async expectVisible() {
    await expect(this.headerTitle).toBeVisible();
    await expect(this.inputBox).toBeVisible();
  }

  async sendMessage(message: string) {
    await this.inputBox.fill(message);
    await this.sendButton.click();
    // Wait for response
    await this.page.waitForTimeout(2000);
  }

  async expectResponse() {
    await expect(this.page.getByText('感谢您的提问')).toBeVisible({ timeout: 10000 });
  }

  async clickQuickAction(actionName: string) {
    await this.page.getByText(actionName).click();
    await this.page.waitForLoadState('networkidle');
  }
}
