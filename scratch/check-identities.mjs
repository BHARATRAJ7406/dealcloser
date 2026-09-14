import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const apiKey = envContent.split('\n').find(l => l.startsWith('ANAKIN_API_KEY=')).split('=')[1].trim();
const baseUrl = 'https://api.anakin.io';

const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
};

async function checkIdentities() {
  console.log('=== CHECKING ANAKIN WIRE IDENTITIES & CATALOG AUTH REQUIREMENTS ===');
  
  const res = await fetch(`${baseUrl}/v1/wire/identities`, { headers });
  console.log(`Identities HTTP Status: ${res.status}`);
  const data = await res.json();
  console.log('Identities Response:', JSON.stringify(data, null, 2));

  // Check all catalog entries to see which ones have auth_required = false or active identities
  const catRes = await fetch(`${baseUrl}/v1/wire/catalog?limit=500`, { headers });
  const catData = await catRes.json();
  const catalog = catData.catalog || [];

  const publicCatalogs = catalog.filter(c => !c.auth_required);
  console.log(`\nFound ${publicCatalogs.length} catalogs with auth_required = false:`);
  for (const c of publicCatalogs) {
    console.log(`- ${c.slug} (${c.name}) [${c.category}] - ${c.description}`);
  }

  // Also check App4Sales
  const app4sales = catalog.filter(c => c.slug.includes('app4sales') || c.name.toLowerCase().includes('app4sales'));
  console.log(`\nApp4Sales Catalogs:`, JSON.stringify(app4sales, null, 2));
}

checkIdentities().catch(console.error);
