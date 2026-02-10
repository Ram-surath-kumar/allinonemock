
import puppeteer from 'puppeteer';
import http from 'http';

const checkServer = () => {
    return new Promise((resolve) => {
        http.get('http://localhost:8080', (res) => {
            resolve(res.statusCode === 200);
        }).on('error', () => {
            resolve(false);
        });
    });
};

(async () => {
    console.log('Waiting for server to be ready...');
    let ready = false;
    for (let i = 0; i < 30; i++) {
        ready = await checkServer();
        if (ready) break;
        await new Promise(r => setTimeout(r, 2000));
        process.stdout.write('.');
    }
    console.log('\nServer is ready!');

    // Launch the browser and open a new blank page
    const browser = await puppeteer.launch({
        headless: false, // Make it visible
        defaultViewport: null, // Full width/height
        args: ['--start-maximized'] // Start maximized
    });
    const page = await browser.newPage();

    // Navigate the page to a URL
    console.log('Navigating to login page...');
    try {
        await page.goto('http://localhost:8080/admin/login', { waitUntil: 'networkidle2' });

        // Set screen size if needed
        await page.setViewport({ width: 1920, height: 1080 });

        console.log('Waiting for selectors...');
        // Note: The app uses Supabase Auth, so look for email/password fields
        await page.waitForSelector('input[id="loopEmailOrId"]', { timeout: 10000 });

        // Use credentials from user history if found, otherwise generic placeholders
        const email = '1000120001@loopverse.in';
        const password = 'password';

        await page.type('input[id="loopEmailOrId"]', email);
        await page.type('input[id="password"]', password);

        console.log('Credentials entered. Attempting to click login button...');
        // Try to find the login button
        const selectors = [
            'button[type="submit"]',
            'button:contains("Login")',
            'button:contains("Sign In")'
        ];

        let loginClicked = false;
        for (const selector of selectors) {
            try {
                if (selector.includes(':contains')) {
                    const text = selector.split('"')[1];
                    const [button] = await page.$x(`//button[contains(text(), "${text}")]`);
                    if (button) {
                        await button.click();
                        loginClicked = true;
                        break;
                    }
                } else {
                    await page.click(selector);
                    loginClicked = true;
                    break;
                }
            } catch (err) {
                // Ignore
            }
        }

        if (loginClicked) {
            console.log('Login button clicked. Keeping browser open for verification.');
        } else {
            console.log('Could not find login button automatically. Please click it manually.');
        }
    } catch (e) {
        console.error('An error occurred during automation:', e.message);
    }

    // Keep browser open
    // await browser.close();
})();

