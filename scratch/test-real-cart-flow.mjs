import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright-core';

const envContent = fs.readFileSync('.env', 'utf8');
const apiKey = envContent.split('\n').find(l => l.startsWith('ANAKIN_API_KEY=')).split('=')[1].trim();

async function testRealCartFlow() {
  console.log('=== TESTING REAL CART FLOW ON FLIPKART VIA ANAKIN BROWSER API ===');
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

  const docsDir = path.resolve(process.cwd(), 'docs');

  // Step 1: Search Flipkart
  console.log('[STEP 1] Navigating to Flipkart Homepage...');
  await page.goto('https://www.flipkart.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  const searchInput = page.locator('input[title*="Search"], input[placeholder*="Search"]').first();
  await searchInput.fill('Sony WH-1000XM4');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(4000);

  // Get product links from search page
  const productLinks = await page.locator('a[href*="/p/"]').evaluateAll(links => 
    links.map(l => ({ title: l.innerText, href: l.getAttribute('href') }))
         .filter(l => l.href && l.href.includes('/p/'))
  );
  console.log(`Found ${productLinks.length} product links on search page.`);
  if (productLinks.length === 0) {
    console.error('No product links found on search page!');
    await browser.close();
    return;
  }

  const selectedLink = productLinks[0];
  const fullProductUrl = selectedLink.href.startsWith('http') ? selectedLink.href : `https://www.flipkart.com${selectedLink.href}`;
  console.log('[STEP 2] Navigating to product page:', fullProductUrl);

  await page.goto(fullProductUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  const productTitle = await page.title();
  console.log('Product Page Title:', productTitle);

  // Save product page screenshot
  await page.screenshot({ path: path.join(docsDir, 'product-page-before.png') });
  console.log('Saved product-page-before.png');

  // Extract Product Title from DOM
  const domTitle = await page.locator('span.VU-VGg, span.B_NuBc, h1._6iL10i, h1').first().innerText().catch(() => '');
  const domPriceText = await page.locator('div.Nx9bqj._4b5WRF, div.Nx9bqj, div._30jeq3').first().innerText().catch(() => '');
  console.log(`DOM Extracted Title: "${domTitle}"`);
  console.log(`DOM Extracted Price: "${domPriceText}"`);

  // Step 3: Find and click Add to Cart
  console.log('[STEP 3] Looking for "Add to Cart" button...');
  const addToCartSelectors = [
    'button:has-text("Add to cart")',
    'button:has-text("ADD TO CART")',
    'button:has-text("Add to Cart")',
    'ul._36fx1x li button',
    '._2KpZ6l._2U9u4O._3v5fav',
    'button._2KpZ6l'
  ];

  let cartClicked = false;
  let clickedSelector = null;
  for (const sel of addToCartSelectors) {
    const btn = page.locator(sel).first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log(`FOUND Add-to-Cart button with selector: "${sel}"! Clicking...`);
      await btn.click().catch(e => console.log('Click error:', e.message));
      cartClicked = true;
      clickedSelector = sel;
      break;
    }
  }

  if (!cartClicked) {
    console.log('Checking all buttons on page:');
    const allButtons = await page.locator('button, a').evaluateAll(els => 
      els.map(e => ({ text: e.innerText?.trim(), tag: e.tagName, class: e.className, id: e.id }))
         .filter(e => e.text && (e.text.toLowerCase().includes('cart') || e.text.toLowerCase().includes('buy')))
    );
    console.log('All matching buttons:', allButtons);
  }

  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(docsDir, 'after-add-to-cart.png') });
  console.log('Saved after-add-to-cart.png');

  // Step 4: Navigate to Cart & Inspect live cart DOM
  console.log('[STEP 4] Navigating to Cart: https://www.flipkart.com/viewcart');
  await page.goto('https://www.flipkart.com/viewcart', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  const cartUrl = page.url();
  const cartPageTitle = await page.title();
  console.log('Cart URL:', cartUrl);
  console.log('Cart Page Title:', cartPageTitle);

  await page.screenshot({ path: path.join(docsDir, 'cart-after-navigation.png') });
  console.log('Saved cart-after-navigation.png');

  // Extract live cart items from DOM
  const cartContentHtml = await page.content();
  const cartItemTitles = await page.locator('a._2Kn22L, a[class*="title"], div[class*="Title"], ._3fV_2q, a._325-Li').allInnerTexts().catch(() => []);
  const cartPrices = await page.locator('span._2-ut7f, div[class*="price"], ._25b18c').allInnerTexts().catch(() => []);
  
  console.log('[STEP 5] LIVE CART DOM EXTRACTION RESULTS:');
  console.log(' Extracted Cart Item Titles:', cartItemTitles);
  console.log(' Extracted Cart Item Prices:', cartPrices);
  console.log(' Page text contains "My Cart":', cartContentHtml.includes('My Cart') || cartContentHtml.includes('Shopping Cart'));

  await browser.close();
}

testRealCartFlow().catch(console.error);
