import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync('.env', 'utf8');
const apiKey = envContent.split('\n').find(l => l.startsWith('ANAKIN_API_KEY=')).split('=')[1].trim();
const baseUrl = 'https://api.anakin.io';

const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
};

async function inspectCatalog() {
  console.log('=== INSPECTING ANAKIN WIRE CATALOG FOR DUMCO & APP4SALES ===');
  
  const res = await fetch(`${baseUrl}/v1/wire/catalog?limit=500`, { headers });
  const data = await res.json();
  const catalog = data.catalog || [];

  console.log(`Total catalog entries: ${catalog.length}`);
  
  const dumcoEntries = catalog.filter(c => c.slug.includes('dumco') || c.name.toLowerCase().includes('dumco'));
  const app4salesEntries = catalog.filter(c => c.slug.includes('app4sales') || c.name.toLowerCase().includes('app4sales'));

  console.log('\n--- DUMCO CATALOG ENTRIES ---');
  console.log(JSON.stringify(dumcoEntries, null, 2));

  console.log('\n--- APP4SALES CATALOG ENTRIES ---');
  console.log(JSON.stringify(app4salesEntries, null, 2));

  for (const entry of catalog) {
    if (entry.slug.includes('dumco') || entry.slug.includes('app4sales')) {
      console.log(`\n=================== CATALOG ENTRY: ${entry.slug} (${entry.name}) ===================`);
      const detailRes = await fetch(`${baseUrl}/v1/wire/catalog/${entry.slug}`, { headers });
      const detail = await detailRes.json();
      console.log(JSON.stringify(detail, null, 2));
    }
  }
}

inspectCatalog().catch(console.error);
