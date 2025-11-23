import { test, expect } from '@playwright/test';

test.describe('LangFuse Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:4200');
  });

  test('should navigate to prompts page', async ({ page }) => {
    // Click on Observability menu
    await page.click('text=Observability');
    // Click on Prompts
    await page.click('text=Prompts');
    
    // Should see prompts list
    await expect(page.locator('text=Prompt Repository')).toBeVisible();
  });

  test('should create a new prompt', async ({ page }) => {
    // Navigate to prompts
    await page.click('text=Observability');
    await page.click('text=Prompts');
    
    // Click new prompt button
    await page.click('text=New Prompt');
    
    // Fill in prompt form
    await page.fill('input[matInput][placeholder*="name"]', 'Test Prompt');
    await page.fill('textarea[matInput]', 'This is a test prompt: {{variable}}');
    
    // Save prompt
    await page.click('button:has-text("Save")');
    
    // Should see success message or redirect
    await expect(page.locator('text=Test Prompt')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to observability dashboard', async ({ page }) => {
    // Click on Observability menu
    await page.click('text=Observability');
    // Click on Traces
    await page.click('text=Traces');
    
    // Should see observability dashboard
    await expect(page.locator('text=Observability Dashboard')).toBeVisible();
  });

  test('should view trace details', async ({ page }) => {
    // Navigate to observability
    await page.click('text=Observability');
    await page.click('text=Traces');
    
    // Click on first trace if available
    const firstTrace = page.locator('a[href*="/observability/traces/"]').first();
    if (await firstTrace.count() > 0) {
      await firstTrace.click();
      
      // Should see trace detail view
      await expect(page.locator('text=Trace')).toBeVisible();
    }
  });

  test('should test prompt in playground', async ({ page }) => {
    // Navigate to prompts
    await page.click('text=Observability');
    await page.click('text=Prompts');
    
    // Click on first prompt if available
    const firstPrompt = page.locator('a[href*="/prompts/"]').first();
    if (await firstPrompt.count() > 0) {
      await firstPrompt.click();
      
      // Click test in playground
      await page.click('text=Test in Playground');
      
      // Should see playground
      await expect(page.locator('text=Prompt Playground')).toBeVisible();
    }
  });
});

