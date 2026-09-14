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

async function testActions() {
  const actionsToTest = [
    { action_id: 'walmart_category_listing', parameters: { browse_url: 'https://www.walmart.com/browse/electronics/shop-tvs-by-size/3944_1060825_2489948', page: 1, limit: 10 } },
    { action_id: 'walmart_deals', parameters: { deal_type: 'flash-deals', page: 1, limit: 10, sort: 'best_match' } },
    { action_id: 'bb_product_pricing', parameters: { sku_id: '6633083' } },
    { action_id: 'act_ebay_ca_search_autocomplete', parameters: { search_keyword: 'sony headphones' } },
    { action_id: 'act_1800flowers_product_pricing', parameters: { part_number: '1001-P-191167' } }
  ];

  for (const item of actionsToTest) {
    console.log(`\n========================================`);
    console.log(`Testing action: ${item.action_id}`);
    try {
      const res = await fetch(`${baseUrl}/v1/wire/task`, {
        method: 'POST',
        headers,
        body: JSON.stringify(item)
      });
      console.log('Submission:', res.status, res.statusText);
      const data = await res.json();
      console.log('Response:', JSON.stringify(data));
      if (data.job_id) {
        for (let p = 0; p < 8; p++) {
          await new Promise(r => setTimeout(r, 2000));
          const jRes = await fetch(`${baseUrl}/v1/wire/jobs/${data.job_id}`, { headers });
          const jData = await jRes.json();
          console.log(` Poll ${p+1}: ${jData.status}`);
          if (jData.status === 'completed') {
            console.log('SUCCESS Result snippet:', JSON.stringify(jData.result).slice(0, 300));
            break;
          } else if (jData.status === 'failed') {
            console.log('FAILED:', JSON.stringify(jData.error));
            break;
          }
        }
      }
    } catch (err) {
      console.error('Error:', err.message);
    }
  }
}

testActions();
