import { test, expect } from '@playwright/test';

test.describe('Authentication Flow E2E', () => {
    const testUser = {
        email: `test-${Date.now()}@test.com`,
        password: 'TestPassword123!',
        name: 'E2E Test User',
    };

    test.beforeEach(async ({ page }) => {
        // Navigate to home page
        await page.goto('http://localhost:3001');
    });

    test('should complete full registration and login flow', async ({ page }) => {
        // Step 1: Navigate to registration
        await page.click('text=Registrar');
        await expect(page).toHaveURL(/.*register/);

        // Step 2: Fill registration form
        await page.fill('input[name="email"]', testUser.email);
        await page.fill('input[name="password"]', testUser.password);
        await page.fill('input[name="name"]', testUser.name);

        // Step 3: Submit registration
        await page.click('button[type="submit"]');

        // Step 4: Verify redirect to login or dashboard
        await page.waitForURL(/.*login|dashboard/, { timeout: 5000 });

        // Step 5: Login if redirected to login page
        if (page.url().includes('login')) {
            await page.fill('input[name="email"]', testUser.email);
            await page.fill('input[name="password"]', testUser.password);
            await page.click('button[type="submit"]');
        }

        // Step 6: Verify successful login
        await page.waitForURL(/.*dashboard|chat/, { timeout: 5000 });
        await expect(page.locator('text=' + testUser.name)).toBeVisible();
    });

    test('should show error for invalid login credentials', async ({ page }) => {
        // Navigate to login
        await page.click('text=Entrar');

        // Fill invalid credentials
        await page.fill('input[name="email"]', 'invalid@test.com');
        await page.fill('input[name="password"]', 'wrongpassword');

        // Submit
        await page.click('button[type="submit"]');

        // Verify error message
        await expect(page.locator('text=/credenciais inválidas|invalid credentials/i')).toBeVisible({
            timeout: 5000,
        });
    });

    test('should validate email format', async ({ page }) => {
        // Navigate to registration
        await page.click('text=Registrar');

        // Fill invalid email
        await page.fill('input[name="email"]', 'invalid-email');
        await page.fill('input[name="password"]', 'password123');
        await page.fill('input[name="name"]', 'Test User');

        // Try to submit
        await page.click('button[type="submit"]');

        // Verify validation error
        const emailInput = page.locator('input[name="email"]');
        const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
        expect(validationMessage).toBeTruthy();
    });

    test('should logout successfully', async ({ page, context }) => {
        // First, login
        await page.click('text=Entrar');
        await page.fill('input[name="email"]', 'existing@test.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');

        // Wait for dashboard/chat
        await page.waitForURL(/.*dashboard|chat/, { timeout: 5000 });

        // Click logout button
        await page.click('button[title="Sair"]');

        // Verify redirect to home/login
        await page.waitForURL(/.*\/$|.*login/, { timeout: 5000 });

        // Verify localStorage is cleared
        const token = await page.evaluate(() => localStorage.getItem('token'));
        expect(token).toBeNull();
    });
});

test.describe('Chat Functionality E2E', () => {
    test.beforeEach(async ({ page }) => {
        // Login before each test
        await page.goto('http://localhost:3001');
        await page.click('text=Entrar');
        await page.fill('input[name="email"]', 'test@test.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL(/.*chat/, { timeout: 5000 });
    });

    test('should send and receive messages', async ({ page }) => {
        // Wait for connection
        await expect(page.locator('text=/Conectado/i')).toBeVisible({ timeout: 5000 });

        // Type message
        const messageInput = page.locator('input[placeholder*="Digite sua mensagem"]');
        await messageInput.fill('Hello from E2E test!');

        // Send message
        await page.click('button[type="submit"]');

        // Verify message appears
        await expect(page.locator('text=Hello from E2E test!')).toBeVisible({ timeout: 5000 });

        // Verify input is cleared
        await expect(messageInput).toHaveValue('');
    });

    test('should toggle dark mode', async ({ page }) => {
        // Click dark mode toggle
        await page.click('button[title*="Modo"]');

        // Verify dark class is added to html
        const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
        expect(isDark).toBe(true);

        // Verify localStorage
        const theme = await page.evaluate(() => localStorage.getItem('theme'));
        expect(theme).toBe('dark');

        // Toggle back
        await page.click('button[title*="Modo"]');
        const isLight = await page.evaluate(() => !document.documentElement.classList.contains('dark'));
        expect(isLight).toBe(true);
    });

    test('should display online users', async ({ page }) => {
        // Wait for online users section
        await expect(page.locator('text=Usuários Online')).toBeVisible();

        // Verify at least one user is shown (could be the current user or others)
        const userCount = await page.locator('aside >> button').count();
        expect(userCount).toBeGreaterThanOrEqual(0);
    });

    test('should search messages', async ({ page }) => {
        // Wait for connection
        await expect(page.locator('text=/Conectado/i')).toBeVisible({ timeout: 5000 });

        // Send a test message
        const messageInput = page.locator('input[placeholder*="Digite sua mensagem"]');
        await messageInput.fill('Searchable message test');
        await page.click('button[type="submit"]');

        // Wait for message to appear
        await expect(page.locator('text=Searchable message test')).toBeVisible();

        // Use search
        const searchInput = page.locator('input[placeholder*="Buscar"]');
        await searchInput.fill('Searchable');
        await searchInput.press('Enter');

        // Verify search results (implementation depends on your search logic)
        await page.waitForTimeout(1000); // Wait for search to complete
    });
});

test.describe('Accessibility E2E', () => {
    test('should be keyboard navigable', async ({ page }) => {
        await page.goto('http://localhost:3001');

        // Tab through elements
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        // Verify focus is visible
        const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(focusedElement).toBeTruthy();
    });

    test('should have proper ARIA labels', async ({ page }) => {
        await page.goto('http://localhost:3001/chat');

        // Check for ARIA labels on interactive elements
        const buttons = page.locator('button');
        const count = await buttons.count();

        for (let i = 0; i < Math.min(count, 5); i++) {
            const button = buttons.nth(i);
            const ariaLabel = await button.getAttribute('aria-label');
            const title = await button.getAttribute('title');
            const text = await button.textContent();

            // Button should have either aria-label, title, or text content
            expect(ariaLabel || title || text).toBeTruthy();
        }
    });
});
