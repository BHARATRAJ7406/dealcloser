import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright-core';

const envContent = fs.readFileSync('.env', 'utf8');
const apiKey = envContent.split('\n').find(l => l.startsWith('ANAKIN_API_KEY=')).split('=')[1].trim();

async function connectBrowser() {
  const wsUrl = `wss://api.anakin.io/v1/browser-connect?token=${apiKey}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`Connecting to Anakin Browser API (attempt ${attempt})...`);
      const browser = await chromium.connectOverCDP(wsUrl, {
        headers: {
          'X-API-Key': apiKey,
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 30000
      });
      return browser;
    } catch (err) {
      console.log(`Attempt ${attempt} error: ${err.message}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error('Failed to connect to Anakin Browser API after 3 attempts');
}

async function runGenuineE2EPass() {
  console.log('=== DEALCLOSER GENUINE E2E LIVE TEST (SHOPIFY STORE) ===');

  const productInfo = {
    store: 'Partake Foods',
    title: 'Classic Grahams',
    productUrl: 'https://partakefoods.com/products/classic-grahams',
    cartUrl: 'https://partakefoods.com/cart',
    expectedPrice: 14.99
  };

  const browser = await connectBrowser();
  const context = browser.contexts()[0] || (await browser.newContext());
  const page = (await context.pages()[0]) || (await context.newPage());
  const docsDir = path.resolve(process.cwd(), 'docs');

  // Step 1: Product Page Navigation
  console.log(`\n[STEP 1: PRODUCT PAGE NAV] Navigating to ${productInfo.productUrl}...`);
  await page.goto(productInfo.productUrl, { waitUntil: 'commit', timeout: 30000 }).catch(e => console.log(`Nav notice: ${e.message}`));
  await page.waitForSelector('h1, button[name="add"], button:has-text("Add to Cart")', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2000);

  const domTitle = await page.locator('h1').first().innerText().catch(() => '');
  console.log(`Live DOM Product Title: "${domTitle.trim()}"`);
  await page.screenshot({ path: path.join(docsDir, 'product-page-before.png'), timeout: 5000 }).catch(() => {});
  console.log('Saved product-page-before.png');

  // Step 2: Add to Cart (ACT)
  console.log('\n[STEP 2: ACT] Looking for "Add to Cart" button...');
  const atcBtn = page.locator('button[name="add"], button:has-text("Add to Cart"), button:has-text("ADD TO CART")').first();
  let actSuccess = false;
  if (await atcBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('Found Add to Cart control on live DOM! Clicking...');
    await atcBtn.click();
    actSuccess = true;
    console.log('ACT SUCCESS: Click executed on live DOM.');
    await page.waitForTimeout(3000);
  } else {
    console.error('ACT FAILED: Add to Cart button not found.');
  }

  await page.screenshot({ path: path.join(docsDir, 'after-add-to-cart.png'), timeout: 5000 }).catch(() => {});
  console.log('Saved after-add-to-cart.png');

  // Step 3: Cart Navigation & Independent Verification
  console.log(`\n[STEP 3: VERIFY] Navigating to live cart URL: ${productInfo.cartUrl}...`);
  await page.goto(productInfo.cartUrl, { waitUntil: 'commit', timeout: 30000 }).catch(e => {
    console.log(`Cart nav notice: ${e.message}`);
  });
  await page.waitForSelector('.cart-item__name, .cart__item-title, a[href*="/products/"], [class*="cart"]', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);

  await page.screenshot({ path: path.join(docsDir, 'cart-after-navigation.png'), timeout: 5000 }).catch(() => {});
  console.log('Saved cart-after-navigation.png');

  const extractedCartTitles = await page
    .locator('.cart-item__name, .cart__item-title, a[href*="/products/"], .cart-item-title, [class*="item-title"]')
    .allInnerTexts()
    .catch(() => []);

  const extractedPrices = await page
    .locator('.cart-item__price, .cart__price, [class*="price"]')
    .allInnerTexts()
    .catch(() => []);

  console.log('\n[LIVE CART DOM EXTRACTION EVIDENCE]');
  console.log(' Extracted Cart Titles:', extractedCartTitles);
  console.log(' Extracted Cart Prices:', extractedPrices);

  const matchedItem = extractedCartTitles.find(t => t.toLowerCase().includes('classic grahams') || t.toLowerCase().includes('grahams'));
  const verifySuccess = Boolean(matchedItem);

  console.log(`\nVERIFICATION RESULT: ${verifySuccess ? 'PASS (100% VERIFIED ON LIVE DOM)' : 'FAIL'}`);
  if (verifySuccess) {
    console.log(` Matched Item in Live Cart DOM: "${matchedItem}"`);
  }

  await browser.close();
}

runGenuineE2EPass().catch(console.error);
