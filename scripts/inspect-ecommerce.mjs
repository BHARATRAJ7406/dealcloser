import fs from 'fs';
import path from 'path';

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
const baseUrl = envVars.ANAKIN_BASE_URL || 'https://api.anakin.io';
const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
};

async function inspectStores() {
  const res = await fetch(`${baseUrl}/v1/wire/catalog?limit=1000`, { headers });
  const data = await res.json();
  const catalog = data.catalog || [];

  const ecommerceSites = catalog.filter(c => 
    c.category === 'ecommerce' || 
    c.category === 'shopping' || 
    c.category === 'marketplace' ||
    ['amazon', 'walmart', 'target', 'bestbuy', 'ebay', 'flipkart', 'myntra', 'croma', 'reliancedigital'].some(name => c.slug.includes(name) || c.name.toLowerCase().includes(name))
  );

  console.log(`Found ${ecommerceSites.length} relevant store catalogs:`);
  for (const store of ecommerceSites) {
    console.log(`\n========================================`);
    console.log(`Store: ${store.name} [slug: ${store.slug}] (Category: ${store.category}, Actions: ${store.action_count})`);
    
    // Fetch detailed entry for actions
    try {
      const detailRes = await fetch(`${baseUrl}/v1/wire/catalog/${store.slug}`, { headers });
      const detail = await detailRes.json();
      const actions = detail.actions || detail.catalog?.actions || [];
      actions.forEach(act => {
        console.log(`  -> [${act.action_id || act.id}] ${act.name || act.title} (type: ${act.type}, auth: ${act.auth_required})`);
        if (act.description) console.log(`     Desc: ${act.description}`);
        if (act.parameters && act.parameters.length) {
          console.log(`     Params:`, JSON.stringify(act.parameters));
        }
      });
    } catch (err) {
      console.log(`  Failed to fetch details for ${store.slug}: ${err.message}`);
    }
  }
}

inspectStores();
