import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const apiKey = envContent.split('\n').find(l => l.startsWith('ANAKIN_API_KEY=')).split('=')[1].trim();
const baseUrl = 'https://api.anakin.io';

const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
};

async function testApp4SalesWire() {
  console.log('=== INSPECTING APP4SALES WIRE ACTIONS & TESTING TASK ===');

  const detailRes = await fetch(`${baseUrl}/v1/wire/catalog/app4sales`, { headers });
  const detail = await detailRes.json();
  console.log('App4Sales Detail:', JSON.stringify(detail, null, 2));

  // Try calling a task
  console.log('\nSubmitting app4sales search/list task...');
  const taskReq = {
    action_id: 'a4s_search_products',
    parameters: {
      query: 'Protein'
    }
  };

  const res = await fetch(`${baseUrl}/v1/wire/task`, {
    method: 'POST',
    headers,
    body: JSON.stringify(taskReq)
  });
  console.log(`HTTP Status: ${res.status}`);
  const taskData = await res.json();
  console.log('Task Response:', JSON.stringify(taskData, null, 2));
}

testApp4SalesWire().catch(console.error);
