import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const apiKey = envContent.split('\n').find(l => l.startsWith('ANAKIN_API_KEY=')).split('=')[1].trim();
const baseUrl = 'https://api.anakin.io';

const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
};

async function listActions() {
  const res = await fetch(`${baseUrl}/v1/wire/catalog?limit=500`, { headers });
  const data = await res.json();
  const catalog = data.catalog || [];

  for (const entry of catalog) {
    if (entry.slug.includes('dumco') || entry.slug.includes('app4sales')) {
      console.log(`\n=================== ${entry.slug} (${entry.name}) ===================`);
      const detailRes = await fetch(`${baseUrl}/v1/wire/catalog/${entry.slug}`, { headers });
      const detail = await detailRes.json();
      const actions = detail.actions || [];
      console.log(`Catalog auth_required: ${entry.auth_required}, auth_types: ${JSON.stringify(entry.auth_types)}`);
      for (const act of actions) {
        console.log(`- action_id: ${act.action_id} | type: ${act.type} | mode: ${act.mode} | auth_required: ${act.auth_required}`);
        console.log(`  description: ${act.description}`);
        console.log(`  parameters: ${JSON.stringify(act.parameters)}`);
      }
    }
  }
}

listActions().catch(console.error);
