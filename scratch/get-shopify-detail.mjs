import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const apiKey = envContent.split('\n').find(l => l.startsWith('ANAKIN_API_KEY=')).split('=')[1].trim();
const baseUrl = 'https://api.anakin.io';

const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
};

async function getShopifyDetail() {
  const detailRes = await fetch(`${baseUrl}/v1/wire/catalog/shopify`, { headers });
  const detail = await detailRes.json();
  console.log(JSON.stringify(detail, null, 2));
}

getShopifyDetail().catch(console.error);
