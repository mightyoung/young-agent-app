import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly hintAccount: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByPlaceholder('请输入用户名');
    this.passwordInput = page.getByPlaceholder('请输入密码');
    this.loginButton = page.getByRole('button', { name: '登录' });
    this.hintAccount = page.getByText('admin / admin123');
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async expectLoginSuccess() {
    // After login, should see home screen
    await expect(this.page.getByText('工业安全检查专家')).toBeVisible({ timeout: 10000 });
  }

  async expectLoginFailed() {
    // Should show error alert
    await expect(this.page.getByText('用户名或密码错误')).toBeVisible({ timeout: 5000 });
  }
}
