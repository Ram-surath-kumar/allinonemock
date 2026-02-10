
import puppeteer from 'puppeteer';

(async () => {
    console.log('Launching browser for Super Admin login...');
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    const page = await browser.newPage();

    try {
        console.log('Navigating to Super Admin Console...');
        await page.goto('http://localhost:5174', { waitUntil: 'networkidle2' });

        await page.waitForSelector('input[placeholder="Enter username"]');

        console.log('Entering Super Admin credentials...');
        await page.type('input[placeholder="Enter username"]', 'UNFOUNDED');
        await page.type('input[placeholder="Enter password"]', 'ZIGGERS');

        console.log('Clicking Login button...');
        await page.click('button[type="submit"]');

        console.log('Login successful. Keeping browser open.');
    } catch (e) {
        console.error('Error during Super Admin login:', e.message);
    }
})();
