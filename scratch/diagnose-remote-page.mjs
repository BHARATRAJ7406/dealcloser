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

async function diagnose() {
  console.log('Connecting to Anakin Remote Browser API CDP...');
  const browser = await chromium.connectOverCDP(wsUrl, {
    headers: {
      'X-API-Key': apiKey,
      'Authorization': `Bearer ${apiKey}`
    },
    timeout: 35000
  });

  console.log('Connected! Creating page...');
  const context = browser.contexts()[0] || (await browser.newContext());
  const page = await context.newPage();

  const targetUrl = 'https://partakefoods.com/products/classic-grahams';
  console.log(`Navigating to ${targetUrl}...`);

  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch((e) => {
    console.log(`Navigation warning: ${e.message}`);
  });

  await page.waitForTimeout(3000);

  const currentUrl = page.url();
  const title = await page.title().catch(() => '');
  console.log('\n--- 1. CURRENT URL ---', currentUrl);
  console.log('--- 2. PAGE TITLE ---', title);

  const info = await page.evaluate(() => {
    const bodyText = (document.body?.innerText || '').slice(0, 1500).replace(/\s+/g, ' ');

    const buttons = Array.from(document.querySelectorAll('button, a[role="button"], input[type="submit"], input[type="button"], a[href*="cart"], form [type="submit"]')).map((b) => {
      return {
        tag: b.tagName.toLowerCase(),
        text: (b.innerText || b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60),
        ariaLabel: b.getAttribute('aria-label') || '',
        name: b.getAttribute('name') || '',
        type: b.getAttribute('type') || '',
        id: b.id || '',
        className: (b.className || '').toString().slice(0, 60),
        disabled: b.disabled || false,
        visible: b.offsetWidth > 0 && b.offsetHeight > 0,
      };
    });

    const forms = Array.from(document.querySelectorAll('form')).map((f) => ({
      action: f.action,
      id: f.id,
      className: (f.className || '').toString().slice(0, 60),
      inputs: Array.from(f.querySelectorAll('input, select, button')).map((i) => ({
        tag: i.tagName.toLowerCase(),
        name: i.name || '',
        type: i.type || '',
        value: i.value || '',
        text: (i.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40),
      })),
    }));

    const addElements = Array.from(document.querySelectorAll('*')).filter((el) => {
      const txt = (el.textContent || '').toLowerCase();
      const attr = ((el.getAttribute('aria-label') || '') + (el.getAttribute('name') || '')).toLowerCase();
      return (txt.includes('add to cart') || txt.includes('add') || attr.includes('add')) && el.children.length < 3;
    }).map((el) => ({
      tag: el.tagName.toLowerCase(),
      text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60),
      className: (el.className || '').toString().slice(0, 60),
      id: el.id || '',
    }));

    const overlays = Array.from(document.querySelectorAll('[id*="cookie"], [class*="cookie"], [id*="modal"], [class*="modal"], [id*="consent"], [class*="consent"]')).map((el) => ({
      id: el.id,
      className: (el.className || '').toString().slice(0, 60),
      text: (el.textContent || '').trim().slice(0, 80),
    }));

    return { bodyText, buttons, forms, addElements, overlays };
  });

  console.log('\n--- 3. BODY TEXT SNAPSHOT (First 1500 chars) ---');
  console.log(info.bodyText);

  console.log('\n--- 4. ALL BUTTONS & CLICKABLES ---');
  console.log(JSON.stringify(info.buttons, null, 2));

  console.log('\n--- 5. PRODUCT FORMS & ELEMENTS ---');
  console.log(JSON.stringify(info.forms, null, 2));

  console.log('\n--- 5b. ELEMENTS CONTAINING "ADD" ---');
  console.log(JSON.stringify(info.addElements, null, 2));

  console.log('\n--- 7. OVERLAYS / CONSENT MODALS ---');
  console.log(JSON.stringify(info.overlays, null, 2));

  await browser.close().catch(() => {});
}

diagnose().catch(console.error);
