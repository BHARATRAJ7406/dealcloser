import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright-core';

const envContent = fs.readFileSync('.env', 'utf8');
const apiKey = envContent.split('\n').find(l => l.startsWith('ANAKIN_API_KEY=')).split('=')[1].trim();

async function testFlipkartStrategies() {
  const wsUrl = `wss://api.anakin.io/v1/browser-connect?token=${apiKey}`;
  const browser = await chromium.connectOverCDP(wsUrl, {
    headers: {
      'X-API-Key': apiKey,
      'Authorization': `Bearer ${apiKey}`
    },
    timeout: 30000
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  console.log('1. Trying Flipkart Home page first...');
  await page.goto('https://www.flipkart.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('Home Title:', await page.title());

  const docsDir = path.resolve(process.cwd(), 'docs');
  await page.screenshot({ path: path.join(docsDir, 'flipkart-home.png') });

  console.log('2. Searching via Flipkart UI...');
  const searchInput = page.locator('input[title*="Search"], input[placeholder*="Search"]').first();
  if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await searchInput.fill('Sony WH-1000XM5');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(5000);
    console.log('Search page URL:', page.url());
    console.log('Search page title:', await page.title());
    await page.screenshot({ path: path.join(docsDir, 'flipkart-search-results.png') });

    // Find first product link
    const firstProduct = page.locator('a[href*="/p/"]').first();
    if (await firstProduct.isVisible({ timeout: 5000 }).catch(() => false)) {
      const productHref = await firstProduct.getAttribute('href');
      const fullUrl = productHref.startsWith('http') ? productHref : `https://www.flipkart.com${productHref}`;
      console.log('Clicking product link:', fullUrl);
      
      const [newPage] = await Promise.all([
        context.waitForEvent('page').catch(() => null),
        firstProduct.click()
      ]);

      const targetPage = newPage || page;
      await targetPage.waitForLoadState('domcontentloaded');
      await targetPage.waitForTimeout(3000);
      console.log('Navigated Product URL:', targetPage.url());
      console.log('Navigated Product Title:', await targetPage.title());
      await targetPage.screenshot({ path: path.join(docsDir, 'flipkart-product-from-search.png') });
    } else {
      console.log('No product links found on search page.');
    }
  } else {
    console.log('Search input not visible on homepage.');
  }

  await browser.close();
}

testFlipkartStrategies().catch(console.error);
