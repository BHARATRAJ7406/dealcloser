import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const apiKey = envContent.split('\n').find(l => l.startsWith('ANAKIN_API_KEY=')).split('=')[1].trim();
const baseUrl = 'https://api.anakin.io';

const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
};

async function testShopifyWire() {
  console.log('=== TESTING WIRE API SHOPIFY SEARCH ===');

  const taskReq = {
    action_id: 'shopify_search',
    parameters: {
      domain: 'partakefoods.com',
      q: 'Cookies'
    }
  };

  const res = await fetch(`${baseUrl}/v1/wire/task`, {
    method: 'POST',
    headers,
    body: JSON.stringify(taskReq)
  });
  console.log(`Task POST Status: ${res.status}`);
  const taskData = await res.json();
  console.log('Task Response:', JSON.stringify(taskData, null, 2));

  if (taskData.job_id) {
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const jobRes = await fetch(`${baseUrl}/v1/wire/jobs/${taskData.job_id}`, { headers });
      const jobData = await jobRes.json();
      console.log(`Poll ${i + 1}: status = ${jobData.status}`);
      if (jobData.status === 'completed') {
        console.log('Wire Shopify Search Result:', JSON.stringify(jobData.result, null, 2).slice(0, 1000));
        break;
      } else if (jobData.status === 'failed') {
        console.log('Wire Shopify Search Failed:', JSON.stringify(jobData.error, null, 2));
        break;
      }
    }
  }
}

testShopifyWire().catch(console.error);
