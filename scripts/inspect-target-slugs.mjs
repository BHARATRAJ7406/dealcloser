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

const targetSlugs = [
  'bestbuy', 'walmart', 'ebay-ca', 'camelcamelcamel',
  'dumco', 'app4sales', 'blueridgeknives', 'weknife',
  '1800flowers', 'mango', '1aauto'
];

async function inspectTargetSlugs() {
  for (const slug of targetSlugs) {
    console.log(`\n========================================`);
    console.log(`CATALOG SLUG: ${slug}`);
    try {
      const res = await fetch(`${baseUrl}/v1/wire/catalog/${slug}`, { headers });
      const data = await res.json();
      const actions = data.actions || data.catalog?.actions || [];
      console.log(`Actions count: ${actions.length}`);
      actions.forEach(a => {
        console.log(` - Action ID: ${a.action_id || a.id}`);
        console.log(`   Name: ${a.name || a.title}`);
        console.log(`   Type: ${a.type}, Mode: ${a.mode}, Auth Required: ${a.auth_required}`);
        console.log(`   Params:`, JSON.stringify(a.parameters || a.params));
      });
    } catch (err) {
      console.error(`Error fetching slug ${slug}:`, err.message);
    }
  }
}

inspectTargetSlugs();
