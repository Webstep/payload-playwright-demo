import { test, expect, type Page } from '@playwright/test';

// Notes:
// This test spec contains tests that is both manually created and using the Playwright MCP server. 
// First the manual tests was created using the playwright codegen tool, and
// copied into this file. The locators needed some tweeking here and there before the tests
// ran successfully. The tests that were manually added are marked with comments below
// Then Github Copilot was using to adde the remaining tests. The following prompt was input
// in plan mode to Github Copilot:
//      Using the playwright mcp server, I want to add a test to the admin.spec.ts file 
//      that deletes the test@example.com user and then try to login again with 
//      test@example.com user and eperience that the user has been deleted. 
//      Please create the test and then verify that is runs sucessfully

// Added by Playwright MCP server
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'testpassword';

// Added by Playwright MCP server
async function loginAs(page: Page, email: string, password: string) {
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
}

// Runs all the tests in this file in sequence. If one of the tests fails, subsequent test will be skipped
test.describe.configure({ mode: 'serial' });
test.beforeEach(async ({ page }) => {
  await page.goto('/admin');
});

// As a user with administrator privileges,
// When I open the admin page
// Then I should be able to log in using the administrator login and password and add a new user account
// Then I should be able to log out
// Then I should be able to log in using the new user account
// Then I should be able to log out
// Then I should be able to log in again using the administrator account and delete the newly created user account
// Then I should verify that the deleted user can no longer log in
test.describe('Administrator user management', () => {

    // Manually added test
    test('Login as administrator and add a new user account', async ({ page }) => {
        // Login with the administrator user
        await loginAs(page, 'admin@example.com', 'password');

        await expect(page).toHaveURL(/admin/);

        // Add a new user
        await page.getByRole('button', { name: 'Show all Users' }).click();
        await page.getByRole('link', { name: 'Create new User' }).click();
        await page.getByRole('textbox', { name: 'Email' }).fill(TEST_USER_EMAIL);
        await page.getByLabel('New Password').fill(TEST_USER_PASSWORD);
        await page.getByLabel('Confirm Password').fill(TEST_USER_PASSWORD);
        await page.getByRole('button', { name: 'Save' }).click();
        await page.getByRole('button', { name: 'close' }).click(); // Workaround: Close the "User created" notification

        // Log out 
        await page.locator('[aria-label="Log out"]').click(); 
        await expect(page).toHaveURL(/admin\/logout/);
        
        // Click the link to return to the login page
        await page.getByRole('link', { name: 'Log back in' }).click();
        await expect(page).toHaveURL(/admin\/login/);
    });

    // Manually added test
    test('Login with the new user account', async ({ page }) => {
        // Log in again with the new user account
        await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);

        // Verify successful login by checking the URL
        await expect(page).toHaveURL(/admin/);
    });

    // Added by Playwright MSP server
    test('Delete the newly created user as administrator', async ({ request }) => {
        const adminLoginResponse = await request.post('/api/users/login', {
        data: {
            email: 'admin@example.com',
            password: 'password',
        },
        });
        expect(adminLoginResponse.ok()).toBeTruthy();

        const adminLoginJson = await adminLoginResponse.json();
        const adminToken = adminLoginJson.token as string;

        const findUserResponse = await request.get(
        `/api/users?where[email][equals]=${encodeURIComponent(TEST_USER_EMAIL)}`,
        {
            headers: {
            Authorization: `JWT ${adminToken}`,
            },
        }
        );
        expect(findUserResponse.ok()).toBeTruthy();

        const findUserJson = await findUserResponse.json();
        const userToDelete = findUserJson.docs?.[0];
        expect(userToDelete).toBeTruthy();

        const deleteUserResponse = await request.delete(`/api/users/${userToDelete.id}`, {
        headers: {
            Authorization: `JWT ${adminToken}`,
        },
        });
        expect(deleteUserResponse.ok()).toBeTruthy();

        const verifyUserDeletedResponse = await request.get(
        `/api/users?where[email][equals]=${encodeURIComponent(TEST_USER_EMAIL)}`,
        {
            headers: {
            Authorization: `JWT ${adminToken}`,
            },
        }
        );
        expect(verifyUserDeletedResponse.ok()).toBeTruthy();

        const verifyUserDeletedJson = await verifyUserDeletedResponse.json();
        expect(verifyUserDeletedJson.docs?.length ?? 0).toBe(0);
    });

    test('Deleted user can no longer log in', async ({ page }) => {
        await page.goto('/admin/login');
        await loginAs(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);

        await expect(page).toHaveURL(/admin\/login/);
        await expect(
        page.getByText(/invalid|incorrect|failed|unable|unauthorized/i).first()
        ).toBeVisible();
    });

});