import { chromium } from 'playwright-core';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const apiKey = envContent.split('\n').find(l => l.startsWith('ANAKIN_API_KEY=')).split('=')[1].trim();

async function getValidProduct() {
  const wsUrl = `wss://api.anakin.io/v1/browser-connect?token=${apiKey}`;
  const browser = await chromium.connectOverCDP(wsUrl, {
    headers: { 'X-API-Key': apiKey, 'Authorization': `Bearer ${apiKey}` },
    timeout: 30000
  });

  const context = browser.contexts()[0] || (await browser.newContext());
  const page = (await context.pages()[0]) || (await context.newPage());

  console.log('Navigating to Partake Foods collection page...');
  await page.goto('https://partakefoods.com/collections/all', { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  const productLinks = await page.locator('a[href*="/products/"]').evaluateAll(els => 
    els.map(e => e.getAttribute('href')).filter(h => h && h.includes('/products/'))
  );

  console.log('Product Links found:', productLinks.slice(0, 5));
  const selectedHref = productLinks[0];
  const fullUrl = selectedHref.startsWith('http') ? selectedHref : `https://partakefoods.com${selectedHref}`;
  console.log('Selected Product URL:', fullUrl);

  await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const title = await page.locator('h1').first().innerText().catch(() => '');
  console.log('Product Page H1 Title:', title.trim());

  await browser.close();
}

getValidProduct().catch(console.error);
