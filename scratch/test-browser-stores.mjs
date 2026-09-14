import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright-core';

const envContent = fs.readFileSync('.env', 'utf8');
const apiKey = envContent.split('\n').find(l => l.startsWith('ANAKIN_API_KEY=')).split('=')[1].trim();

async function testStores() {
  console.log('=== TESTING BROWSER API ON PUBLIC STORES (SHOPIFY / RETAIL) ===');
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

  // Test 1: Public Shopify Store (e.g. Partake Foods or Allbirds or any public shopify store)
  const shopifyStoreUrl = 'https://partakefoods.com/collections/all';
  console.log('\n--- TEST: Shopify Store (Partake Foods) ---');
  const page = await context.newPage();
  
  await page.goto(shopifyStoreUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('Collection Title:', await page.title());

  // Find first product
  const firstProduct = page.locator('a[href*="/products/"]').first();
  if (await firstProduct.isVisible({ timeout: 5000 }).catch(() => false)) {
    const productHref = await firstProduct.getAttribute('href');
    const fullProductUrl = productHref.startsWith('http') ? productHref : `https://partakefoods.com${productHref}`;
    console.log('Product URL:', fullProductUrl);

    await page.goto(fullProductUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('Product Title:', await page.title());

    // Extract DOM product title and price
    const titleText = await page.locator('h1').first().innerText().catch(() => '');
    console.log(`Live DOM Product Title: "${titleText.trim()}"`);

    // Look for Add to Cart
    const atcBtn = page.locator('button[name="add"], button:has-text("Add to Cart"), button:has-text("ADD TO CART")').first();
    if (await atcBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Found Add to Cart button! Clicking...');
      await atcBtn.click();
      await page.waitForTimeout(3000);

      // Navigate to Cart
      console.log('Navigating to /cart...');
      await page.goto('https://partakefoods.com/cart', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);

      console.log('Cart URL:', page.url());
      console.log('Cart Page Title:', await page.title());

      // Extract cart items from DOM
      const cartItems = await page.locator('.cart-item__name, .cart__item-title, a[href*="/products/"], .cart-item, [class*="cart"]').evaluateAll(els => 
        els.map(e => e.innerText?.trim()).filter(t => t && t.length > 3)
      );
      console.log('EXTRACTED LIVE CART ITEMS:', cartItems.slice(0, 10));
    } else {
      console.log('Add to cart button not found on shopify product page.');
    }
  }

  await browser.close();
}

testStores().catch(console.error);
