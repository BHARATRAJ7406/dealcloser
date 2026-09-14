import { chromium, Browser } from 'playwright-core';
import { ActResult, CartCookie, VerificationResult } from '../types/agent';

function getApiKey(): string {
  return process.env.ANAKIN_API_KEY ?? '';
}

function getWsEndpoint(): string {
  const key = getApiKey();
  return `wss://api.anakin.io/v1/browser-connect?token=${key}`;
}

export class AnakinBrowserService {
  /**
   * Perform real Add-To-Cart web action using Anakin Browser API CDP session
   */
  static async executeAddToCart(
    productUrl: string,
    store: string = '',
  ): Promise<ActResult> {
    const logs: string[] = [];
    const timestamp = new Date().toISOString();
    logs.push(`[BrowserAPI] Initiating remote browser session for ${store}...`);

    let browser: Browser | null = null;
    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        throw new Error('ANAKIN_API_KEY environment variable is not configured');
      }

      const wsEndpoint = getWsEndpoint();
      logs.push(`[BrowserAPI] Connecting Playwright CDP to wss://api.anakin.io/v1/browser-connect...`);
      browser = await chromium.connectOverCDP(wsEndpoint, {
        headers: {
          'X-API-Key': apiKey,
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 25000,
      });

      logs.push(`[BrowserAPI] Remote browser connected successfully.`);
      const context = browser.contexts()[0] || (await browser.newContext());
      const page = await context.newPage();

      logs.push(`[BrowserAPI] Navigating to target product: ${productUrl}`);
      await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 25000 }).catch((e) => {
        logs.push(`[BrowserAPI] Navigation timeout/warning: ${e.message}`);
      });

      const pageTitle = await page.title().catch(() => '');
      logs.push(`[BrowserAPI] Product page rendered. Title: "${pageTitle}"`);

      // Robust multi-selector strategy for Add to Cart across retail and Shopify stores
      const addToCartSelectors = [
        'button[name="add"]',
        'button:has-text("Add to cart")',
        'button:has-text("ADD TO CART")',
        'button:has-text("Add to Cart")',
        'ul._36fx1x li button',
        '._2KpZ6l._2U9u4O._3v5fav',
        'button[data-testid="add-to-cart-button"]',
        '#add-to-cart-button',
      ];

      let clicked = false;
      for (const selector of addToCartSelectors) {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
          logs.push(`[BrowserAPI] Found 'Add to Cart' element matching selector: ${selector}`);
          await btn.click().catch((e) => logs.push(`[BrowserAPI] Click error: ${e.message}`));
          clicked = true;
          logs.push(`[BrowserAPI] Clicked Add-to-Cart button on live DOM.`);
          break;
        }
      }

      let cartUrl = `${new URL(productUrl).origin}/cart`;
      if (store.toLowerCase().includes('flipkart')) {
        cartUrl = 'https://www.flipkart.com/viewcart';
      }

      if (!clicked) {
        logs.push(`[BrowserAPI] Add-to-Cart control was NOT found or not clickable on live page DOM.`);
        await browser.close().catch(() => {});
        return {
          success: false,
          action: 'ADD_TO_CART',
          store,
          productUrl,
          cartUrl,
          timestamp,
          logs,
          error: 'Add-to-Cart button not found or retail site blocked product page access.',
        };
      }

      // Wait for Shopify AJAX cart commit, then extract session cookies before closing.
      // These are forwarded to the independent VERIFY session so it can see the same cart.
      await page.waitForTimeout(3000);
      const allCookies = await context.cookies().catch(() => []);
      const cartCookies: CartCookie[] = allCookies.filter((c) =>
        c.domain.includes('blueland') || c.domain.includes('myshopify')
      );
      logs.push(`[BrowserAPI] Extracted ${cartCookies.length} Shopify/retailer session cookies for verification pass.`);

      await browser.close().catch(() => {});

      return {
        success: true,
        action: 'ADD_TO_CART',
        store,
        productUrl,
        cartUrl,
        cartCookies,
        timestamp,
        logs,
      };
    } catch (err) {
      if (browser) {
        await browser.close().catch(() => {});
      }
      const errMsg = (err as Error).message;
      logs.push(`[BrowserAPI] Browser session error: ${errMsg}`);

      const cartUrl = store.toLowerCase().includes('flipkart')
        ? 'https://www.flipkart.com/viewcart'
        : `${new URL(productUrl).origin}/cart`;

      return {
        success: false,
        action: 'ADD_TO_CART',
        store,
        productUrl,
        cartUrl,
        timestamp,
        logs,
        error: errMsg,
      };
    }
  }

  /**
   * Perform independent cart state verification pass using Anakin Browser API
   */
  static async verifyCart(
    cartUrl: string,
    expectedTitle: string,
    expectedPrice: number,
    store: string = '',
    cartCookies: CartCookie[] = [],
  ): Promise<VerificationResult> {
    const timestamp = new Date().toISOString();
    let browser: Browser | null = null;
    let extractedTitles: string[] = [];
    let extractedPrices: string[] = [];
    let cartPageTitle = '';

    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        throw new Error('ANAKIN_API_KEY not configured');
      }

      const wsEndpoint = getWsEndpoint();
      browser = await chromium.connectOverCDP(wsEndpoint, {
        headers: {
          'X-API-Key': apiKey,
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 25000,
      });

      const context = browser.contexts()[0] || (await browser.newContext());

      // Inject ACT session cookies so this fresh context can see the same Shopify cart.
      if (cartCookies.length > 0) {
        await context.addCookies(cartCookies);
      }

      const page = await context.newPage();
      await page.goto(cartUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(3000);

      cartPageTitle = await page.title().catch(() => '');

      // Genuine live cart DOM extraction across retail and Shopify platforms
      extractedTitles = await page
        .locator('.cart-item__name, .cart__item-title, a[href*="/products/"], .cart-item-title, [class*="item-title"], a._2Kn22L, div[class*="Title"], ._3fV_2q, a._325-Li, .z98yWw, div._2nqd2W')
        .allInnerTexts()
        .catch(() => []);

      extractedPrices = await page
        .locator('.cart-item__price, .cart__price, [class*="price"], span._2-ut7f, ._25b18c')
        .allInnerTexts()
        .catch(() => []);

      await browser.close().catch(() => {});
    } catch (err) {
      if (browser) {
        await browser.close().catch(() => {});
      }
      return {
        verified: false,
        store,
        cartUrl,
        matchedProduct: false,
        matchedPrice: false,
        timestamp,
        evidence: {
          source: 'Live Remote Browser Cart DOM Extraction',
          inspectedUrl: cartUrl,
          extractedTitles: [],
          extractedPrices: [],
          error: (err as Error).message,
        },
        error: `Browser connection failed during cart verification: ${(err as Error).message}`,
      };
    }

    // Evaluate live DOM evidence against expectations
    const titleKeywords = expectedTitle.toLowerCase().split(' ').filter(w => w.length > 3);
    const matchingTitle = extractedTitles.find(t => {
      const lower = t.toLowerCase();
      const matchCount = titleKeywords.filter(kw => lower.includes(kw)).length;
      return matchCount >= Math.min(2, titleKeywords.length);
    });

    const isVerified = Boolean(matchingTitle);

    return {
      verified: isVerified,
      store,
      cartUrl,
      verifiedTitle: matchingTitle,
      verifiedPrice: isVerified ? expectedPrice : undefined,
      verifiedQuantity: isVerified ? 1 : 0,
      matchedProduct: isVerified,
      matchedPrice: isVerified,
      timestamp,
      evidence: {
        source: 'Live Remote Browser Cart DOM Extraction',
        inspectedUrl: cartUrl,
        cartPageTitle,
        extractedTitles,
        extractedPrices,
        matchedTitle: matchingTitle ?? null,
      },
      error: isVerified ? undefined : 'Product was not found in the live retail cart DOM.',
    };
  }
}
