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

async function findActions() {
  const queries = ['search product', 'amazon', 'ebay', 'cart', 'add to cart', 'walmart', 'electronics', 'price'];
  
  for (const q of queries) {
    console.log(`\n========================================`);
    console.log(`QUERY: "${q}"`);
    try {
      const res = await fetch(`${baseUrl}/v1/wire/resolve?q=${encodeURIComponent(q)}`, { headers });
      const data = await res.json();
      const results = data.results || [];
      console.log(`Found ${results.length} actions:`);
      results.slice(0, 10).forEach(r => {
        console.log(` - Action ID: ${r.action_id} (Catalog: ${r.catalog})`);
        console.log(`   Description: ${r.description || r.name || ''}`);
        if (r.params) {
          console.log(`   Params:`, JSON.stringify(r.params));
        }
      });
    } catch (err) {
      console.error(`Error resolving "${q}":`, err.message);
    }
  }
}

findActions();
