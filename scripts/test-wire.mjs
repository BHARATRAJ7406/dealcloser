import fs from 'fs';
import path from 'path';

// Read .env file manually
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

console.log('Base URL:', baseUrl);
console.log('API Key length:', apiKey ? apiKey.length : 0);

async function run() {
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

  console.log('\n--- 1. Testing GET /v1/wire/catalog ---');
  try {
    const res = await fetch(`${baseUrl}/v1/wire/catalog`, { headers });
    console.log('Status:', res.status, res.statusText);
    const data = await res.json();
    console.log('Catalog Response Keys:', Object.keys(data));
    if (data.catalog) {
      console.log(`Found ${data.catalog.length} catalog items:`);
      data.catalog.slice(0, 15).forEach(c => {
        console.log(` - [${c.slug}] ${c.name} (${c.category}) - ${c.action_count || 0} actions`);
      });
    } else {
      console.log('Raw data:', JSON.stringify(data).slice(0, 500));
    }
  } catch (err) {
    console.error('Catalog fetch error:', err.message);
  }

  console.log('\n--- 2. Testing GET /v1/wire/resolve?q=search ---');
  try {
    const res = await fetch(`${baseUrl}/v1/wire/resolve?q=search+products`, { headers });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Resolve results:', JSON.stringify(data).slice(0, 500));
  } catch (err) {
    console.error('Resolve error:', err.message);
  }

  console.log('\n--- 3. Testing GET /v1/wire/identities ---');
  try {
    const res = await fetch(`${baseUrl}/v1/wire/identities`, { headers });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Identities results:', JSON.stringify(data).slice(0, 500));
  } catch (err) {
    console.error('Identities error:', err.message);
  }
}

run();
