import { test, expect } from '@playwright/test';

test.describe('RustDesk Console', () => {
  test('login page should load', async ({ page }) => {
    await page.goto('/user/login');
    
    await expect(page).toHaveTitle(/RustDesk Console/);
    
    await expect(page.getByPlaceholder('Username')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
  });

  test('login with valid credentials', async ({ page }) => {
    await page.goto('/user/login');
    
    await page.getByPlaceholder('Username').fill('admin');
    await page.getByPlaceholder('Password').fill('admin123');
    
    await page.getByRole('button', { name: /Login|登录/i }).click();
    
    await page.waitForURL('**/dashboard/**', { timeout: 10000 });
    
    await expect(page).toHaveURL(/dashboard/);
  });

  test('dashboard should show statistics', async ({ page }) => {
    await page.goto('/user/login');
    await page.getByPlaceholder('Username').fill('admin');
    await page.getByPlaceholder('Password').fill('admin123');
    await page.getByRole('button', { name: /Login|登录/i }).click();
    
    await page.waitForURL('**/dashboard/**', { timeout: 10000 });
    
    await expect(page.locator('.ant-statistic').first().toBeVisible({ timeout: 10000 });
  });

  test('navigate to devices page', async ({ page }) => {
    await page.goto('/user/login');
    await page.getByPlaceholder('Username').fill('admin');
    await page.getByPlaceholder('Password').fill('admin123');
    await page.getByRole('button', { name: /Login|登录/i }).click();
    
    await page.waitForURL('**/dashboard/**', { timeout: 10000 });
    
    await page.click('text=设备管理');
    await page.waitForTimeout(500);
    await page.click('text=设备列表');
    
    await expect(page).toHaveURL(/devices/, { timeout: 10000 });
  });

  test('check console for errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/user/login');
    await page.waitForLoadState('networkidle');
    
    expect(errors).toHaveLength(0);
  });
});
