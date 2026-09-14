import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const apiKey = envContent.split('\n').find(l => l.startsWith('ANAKIN_API_KEY=')).split('=')[1].trim();
const baseUrl = 'https://api.anakin.io';

const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
};

async function findWorkingActions() {
  console.log('=== FINDING PUBLIC ECOMMERCE WIRE ACTIONS ===');

  const catRes = await fetch(`${baseUrl}/v1/wire/catalog?limit=500`, { headers });
  const catData = await catRes.json();
  const catalog = catData.catalog || [];

  const ecommerceCatalogs = catalog.filter(c => 
    c.category === 'ecommerce' || c.category === 'shopping' || c.category === 'marketplace'
  );

  console.log(`Found ${ecommerceCatalogs.length} ecommerce/shopping/marketplace catalogs.`);

  for (const entry of ecommerceCatalogs) {
    const detailRes = await fetch(`${baseUrl}/v1/wire/catalog/${entry.slug}`, { headers });
    const detail = await detailRes.json();
    const actions = detail.actions || [];

    const publicActions = actions.filter(a => !a.auth_required);
    if (publicActions.length > 0) {
      console.log(`\nCatalog: ${entry.slug} (${entry.name}) - ${entry.url}`);
      for (const act of publicActions) {
        console.log(`  - action_id: ${act.action_id} (${act.type}/${act.mode}): ${act.description}`);
      }
    }
  }
}

findWorkingActions().catch(console.error);
