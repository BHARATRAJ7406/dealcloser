import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright-core';

const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const [key, ...val] = line.split('=');
  if (key && val.length > 0) {
    envVars[key.trim()] = val.join('=').trim();
  }
}

const apiKey = envVars.ANAKIN_API_KEY;
const wsUrl = `wss://api.anakin.io/v1/browser-connect?token=${apiKey}`;

async function auditLiveBrowser() {
  console.log('=== AUDITING LIVE ANAKIN BROWSER API (NO MOCKS) ===');
  console.log(`Connecting CDP WebSocket to ${wsUrl.replace(apiKey, 'REDACTED')}...`);

  let browser = null;
  try {
    browser = await chromium.connectOverCDP(wsUrl, {
      headers: {
        'X-API-Key': apiKey,
        'Authorization': `Bearer ${apiKey}`,
      },
      timeout: 30000,
    });

    console.log('Connected to Anakin Remote Browser!');
    const context = browser.contexts()[0] || (await browser.newContext());
    const page = await context.newPage();

    const targetUrl = 'https://www.flipkart.com/sony-wh-1000xm5-bluetooth-headset/p/itm5b035a9f24238';
    console.log(`Navigating to: ${targetUrl}`);

    const response = await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 }).catch(err => {
      console.log(`page.goto result/error: ${err.message}`);
      return null;
    });

    if (response) {
      console.log(`Response HTTP Status: ${response.status()}`);
    }

    const title = await page.title();
    console.log(`Live Page Title: "${title}"`);

    const pageContent = await page.content();
    console.log(`Page DOM Content Length: ${pageContent.length} bytes`);
    console.log(`Snippet: ${pageContent.slice(0, 500)}`);

    // Check for real add to cart button in DOM
    const buttons = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      return btns.map(b => ({
        text: b.innerText.trim(),
        className: b.className,
        id: b.id
      })).filter(b => b.text.toLowerCase().includes('cart') || b.text.toLowerCase().includes('buy'));
    });

    console.log('Interactive Buttons Found on Page:', JSON.stringify(buttons, null, 2));

    await browser.close();
  } catch (err) {
    console.error('Audit Live Browser Exception:', err.message);
    if (browser) await browser.close().catch(() => {});
  }
}

auditLiveBrowser();
