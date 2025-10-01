

import asyncio
from playwright import async_api

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:3000", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # Click the 'Get Started Free' button (a SignUpButton)
        # This button is typically found in the hero section on page.tsx
        # or in the navbar, we'll try the one in the hero section first
        
        # Locate the 'Start Researching Free' button on the homepage, which is a SignUpButton.
        await page.locator('xpath=//button[contains(., "Start Researching Free")]').click(timeout=5000)

        # Wait for the URL to change to a Clerk authentication domain
        await page.wait_for_url(lambda url: "clerk.accounts.dev" in url, timeout=10000)
        
        # Assert that the navigation to Clerk's domain was successful
        assert "clerk.accounts.dev" in page.url, f"Failed to navigate to Clerk authentication page. Current URL: {page.url}"

        # If we successfully reached a Clerk page, the initial part of the test passes.
        # Further steps would require interacting with Clerk's UI, which is outside the scope of
        # 'out-of-box' testing without explicit credentials or mocking.
        print("Successfully redirected to Clerk authentication page.")
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    