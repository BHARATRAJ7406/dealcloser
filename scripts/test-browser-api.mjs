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
console.log('Testing Browser API endpoint check...');

async function testBrowserApi() {
  const wsUrl = `wss://api.anakin.io/v1/browser-connect?token=${apiKey}`;
  console.log('Browser API WebSocket URL constructed:', wsUrl.replace(apiKey, 'REDACTED'));

  try {
    // Test HTTP endpoint ping if available or check playwright
    const httpRes = await fetch(`https://api.anakin.io/v1/wire/catalog?limit=1`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    console.log('Wire API baseline check:', httpRes.status);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testBrowserApi();
