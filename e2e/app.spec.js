import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/sign in|login/i);
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /password/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|login/i })).toBeEnabled();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.getByRole('link', { name: /create account|sign up|register/i }).click();
    await expect(page).toHaveURL(/register/);
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /display name|name/i })).toBeVisible();
  });

  test('should show validation errors for invalid login', async ({ page }) => {
    await page.getByRole('textbox', { name: /email/i }).fill('invalid');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    
    await expect(page.locator('text=/invalid|error/i')).toBeVisible({ timeout: 3000 });
  });

  test('should register new user successfully', async ({ page }) => {
    await page.getByRole('link', { name: /create account|sign up|register/i }).click();
    
    const timestamp = Date.now();
    await page.getByRole('textbox', { name: /email/i }).fill(`test${timestamp}@example.com`);
    await page.getByRole('textbox', { name: /display name|name/i }).fill('Test User');
    await page.getByRole('textbox', { name: /password/i }).first().fill('Test123!@#');
    
    const confirmPasswordField = page.getByRole('textbox', { name: /confirm/i });
    if (await confirmPasswordField.isVisible()) {
      await confirmPasswordField.fill('Test123!@#');
    }
    
    await page.getByRole('button', { name: /sign up|register|create/i }).click();
    
    await expect(page.locator('text=/success|created/i')).toBeVisible({ timeout: 5000 });
  });

  test('should check accessibility on login page', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('Full User Journey', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  test.skip('complete workflow: login → profile → timer → reminders → goals', async ({ page }) => {
    // This test requires authentication setup
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: /profile|settings/i })).toBeVisible();
    
    // Navigate to timer controls
    const timerTab = page.getByRole('tab', { name: /timer/i });
    if (await timerTab.isVisible()) {
      await timerTab.click();
      await expect(page.getByText(/focus time|pomodoro/i)).toBeVisible();
      
      // Test timer preset creation
      const addPresetButton = page.getByRole('button', { name: /add preset/i });
      if (await addPresetButton.isVisible()) {
        await addPresetButton.click();
        await page.getByPlaceholderText(/preset name/i).fill('E2E Test Preset');
        await page.getByRole('button', { name: /create/i }).click();
        await expect(page.getByText('E2E Test Preset')).toBeVisible({ timeout: 5000 });
      }
    }
    
    // Test reminders tab
    const remindersTab = page.getByRole('tab', { name: /reminder/i });
    if (await remindersTab.isVisible()) {
      await remindersTab.click();
      await expect(page.getByText(/reminder preferences|notification/i)).toBeVisible();
      
      // Toggle reminder setting
      const enabledCheckbox = page.getByLabel(/enable reminders/i);
      if (await enabledCheckbox.isVisible()) {
        await enabledCheckbox.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Test goals tab
    const goalsTab = page.getByRole('tab', { name: /goal/i });
    if (await goalsTab.isVisible()) {
      await goalsTab.click();
      await expect(page.getByText(/goal settings|weekly target/i)).toBeVisible();
      
      // Change weekly target
      const weeklyTargetInput = page.getByLabel(/weekly target/i);
      if (await weeklyTargetInput.isVisible()) {
        await weeklyTargetInput.fill('30');
        await page.waitForTimeout(1000);
      }
    }
  });
});

test.describe('UI Element Discovery', () => {
  test('should find and validate all interactive elements on homepage', async ({ page }) => {
    await page.goto('/');
    
    // Find all buttons
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons`);
    
    for (const button of buttons.slice(0, 10)) {
      const isVisible = await button.isVisible();
      const isEnabled = await button.isEnabled();
      const text = await button.textContent();
      console.log(`Button: "${text}" - Visible: ${isVisible}, Enabled: ${isEnabled}`);
    }
    
    // Find all links
    const links = await page.locator('a').all();
    console.log(`Found ${links.length} links`);
    
    // Find all form inputs
    const inputs = await page.locator('input, textarea, select').all();
    console.log(`Found ${inputs.length} form inputs`);
    
    expect(buttons.length).toBeGreaterThan(0);
  });

  test('should validate navigation menu items', async ({ page }) => {
    await page.goto('/');
    
    const navLinks = await page.locator('nav a, header a').all();
    for (const link of navLinks) {
      if (await link.isVisible()) {
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        console.log(`Nav link: "${text}" → ${href}`);
      }
    }
  });
});

test.describe('Performance Check', () => {
  test('should load homepage within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    console.log(`Homepage loaded in ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000);
  });
});
