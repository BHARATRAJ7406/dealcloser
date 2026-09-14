import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright-core';

const envContent = fs.readFileSync('.env', 'utf8');
const apiKey = envContent.split('\n').find(l => l.startsWith('ANAKIN_API_KEY=')).split('=')[1].trim();

async function inspectPage() {
  console.log('--- INSPECTING FLIPKART PRODUCT PAGE VIA ANAKIN BROWSER API ---');
  const wsUrl = `wss://api.anakin.io/v1/browser-connect?token=${apiKey}`;
  
  const browser = await chromium.connectOverCDP(wsUrl, {
    headers: {
      'X-API-Key': apiKey,
      'Authorization': `Bearer ${apiKey}`
    },
    timeout: 30000
  });

  const context = browser.contexts()[0] || await browser.newContext();
  const page = await context.newPage();

  const productUrl = 'https://www.flipkart.com/sony-wh-1000xm5-bluetooth-headset/p/itm5b035a9f24238';
  console.log('Navigating to:', productUrl);
  
  await page.goto(productUrl, { waitUntil: 'networkidle', timeout: 45000 }).catch(e => console.log('Goto warning:', e.message));

  const currentUrl = page.url();
  const title = await page.title();
  console.log('Final URL:', currentUrl);
  console.log('Page Title:', title);

  // Take screenshot of product page before action
  const docsDir = path.resolve(process.cwd(), 'docs');
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
  await page.screenshot({ path: path.join(docsDir, 'product-page-before.png'), fullPage: false });
  console.log('Saved product-page-before.png');

  // Check headings, buttons, text
  const h1 = await page.locator('h1').allInnerTexts().catch(() => []);
  const h2 = await page.locator('h2').allInnerTexts().catch(() => []);
  const spanTitle = await page.locator('.B_NuBc, ._35KySy, .VU-VGg, ._6iL10i, span.B_NuBc').allInnerTexts().catch(() => []);
  console.log('H1 elements:', h1);
  console.log('H2 elements:', h2);
  console.log('Title spans:', spanTitle);

  // Find buttons or buy/cart elements
  const buttons = await page.locator('button, a').evaluateAll(els => 
    els.map(e => ({ text: e.innerText?.trim(), tag: e.tagName, class: e.className, href: e.getAttribute('href') }))
       .filter(e => e.text && (e.text.toLowerCase().includes('cart') || e.text.toLowerCase().includes('buy')))
  );
  console.log('Cart/Buy Buttons found:', buttons);

  await browser.close();
}

inspectPage().catch(console.error);
