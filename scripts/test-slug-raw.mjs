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

async function testSlugRaw() {
  const res = await fetch(`${baseUrl}/v1/wire/catalog/bestbuy`, { headers });
  const data = await res.json();
  console.log('GET /v1/wire/catalog/bestbuy response structure:', JSON.stringify(data, null, 2));
}

testSlugRaw();
