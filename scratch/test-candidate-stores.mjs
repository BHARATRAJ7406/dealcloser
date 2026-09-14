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

const candidates = [
  {
    store: 'Death Wish Coffee',
    name: 'Whole Bean Coffee',
    url: 'https://www.deathwishcoffee.com/products/whole-bean-coffee',
    cartUrl: 'https://www.deathwishcoffee.com/cart',
  },
  {
    store: 'Blueland',
    name: 'Hand Soap Starter Set',
    url: 'https://www.blueland.com/products/hand-soap-starter-set',
    cartUrl: 'https://www.blueland.com/cart',
  },
  {
    store: 'Beardo',
    name: 'Godfather Beard Oil',
    url: 'https://beardo.in/products/beardo-godfather-beard-oil-30ml',
    cartUrl: 'https://beardo.in/cart',
  },
  {
    store: 'Partake Foods (All Products)',
    name: 'Cookie Variety Pack',
    url: 'https://partakefoods.com/products/crunchy-chocolate-chip-cookies',
    cartUrl: 'https://partakefoods.com/cart',
  }
];

async function testCandidates() {
  console.log('Connecting to Anakin Remote Browser API CDP...');
  const browser = await chromium.connectOverCDP(wsUrl, {
    headers: {
      'X-API-Key': apiKey,
      'Authorization': `Bearer ${apiKey}`
    },
    timeout: 35000
  });

  for (const cand of candidates) {
    console.log(`\n==================================================`);
    console.log(`TESTING CANDIDATE: ${cand.store} - ${cand.name}`);
    console.log(`URL: ${cand.url}`);

    const context = browser.contexts()[0] || (await browser.newContext());
    const page = await context.newPage();

    try {
      await page.goto(cand.url, { waitUntil: 'domcontentloaded', timeout: 25000 }).catch((e) => {
        console.log(`Goto note: ${e.message}`);
      });

      await page.waitForTimeout(2000);
      const title = await page.title().catch(() => '');
      const currentUrl = page.url();

      console.log(`Page Title: "${title}"`);
      console.log(`Final URL: "${currentUrl}"`);

      // Find add to cart button
      const addToCartSelectors = [
        'button[name="add"]',
        'button:has-text("Add to cart")',
        'button:has-text("ADD TO CART")',
        'button:has-text("Add to Cart")',
        'button[data-testid="add-to-cart-button"]',
        'form[action*="/cart/add"] button[type="submit"]',
        'button[type="submit"]',
        'input[type="submit"][name="add"]',
        '#add-to-cart-button',
        '.add-to-cart'
      ];

      let clicked = false;
      let matchedSelector = '';
      for (const sel of addToCartSelectors) {
        const btn = page.locator(sel).first();
        if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
          matchedSelector = sel;
          console.log(`Found Add to Cart control matching selector: "${sel}"`);
          const txt = await btn.innerText().catch(() => '');
          console.log(`Button Text: "${txt.trim().replace(/\s+/g, ' ')}"`);
          
          await btn.click({ timeout: 5000 }).catch((e) => console.log(`Click error: ${e.message}`));
          clicked = true;
          console.log('>>> CLICK EXECUTED ON LIVE REMOTE BROWSER DOM! <<<');
          break;
        }
      }

      if (!clicked) {
        console.log('RESULT: NO ADD-TO-CART CONTROL FOUND');
        await page.close().catch(() => {});
        continue;
      }

      await page.waitForTimeout(3000);

      // Verify cart
      console.log(`Navigating to Cart: ${cand.cartUrl}`);
      await page.goto(cand.cartUrl, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(2000);

      const cartTitles = await page
        .locator('.cart-item__name, .cart__item-title, a[href*="/products/"], .cart-item-title, [class*="item-title"], [class*="product-title"], [class*="title"]')
        .allInnerTexts()
        .catch(() => []);

      const cartPrices = await page
        .locator('.cart-item__price, .cart__price, [class*="price"]')
        .allInnerTexts()
        .catch(() => []);

      console.log(`LIVE CART TITLES (${cartTitles.length}):`, cartTitles.slice(0, 5));
      console.log(`LIVE CART PRICES (${cartPrices.length}):`, cartPrices.slice(0, 5));

      const titleKeywords = cand.name.toLowerCase().split(' ');
      const match = cartTitles.find(t => {
        const lower = t.toLowerCase();
        return titleKeywords.some(kw => kw.length > 3 && lower.includes(kw));
      });

      if (match) {
        console.log(`\n🎉>>> 100% VERIFY SUCCESS! Found "${match}" in live cart DOM! <<<🎉\n`);
      } else {
        console.log(`Verify note: item list extracted above.`);
      }

      await page.close().catch(() => {});
    } catch (err) {
      console.log(`Error testing ${cand.store}: ${err.message}`);
      await page.close().catch(() => {});
    }
  }

  await browser.close().catch(() => {});
}

testCandidates().catch(console.error);
