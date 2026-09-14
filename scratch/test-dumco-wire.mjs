import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const apiKey = envContent.split('\n').find(l => l.startsWith('ANAKIN_API_KEY=')).split('=')[1].trim();
const baseUrl = 'https://api.anakin.io';

const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
};

async function testDumcoWire() {
  console.log('=== TESTING DUMCO WIRE ACTIONS ===');

  // Step 1: Search products
  console.log('\n[1. SEARCH PRODUCTS] Submitting dmc_search_products task...');
  const searchTask = {
    action_id: 'dmc_search_products',
    parameters: {
      query: 'Balpolster'
    }
  };

  const res1 = await fetch(`${baseUrl}/v1/wire/task`, {
    method: 'POST',
    headers,
    body: JSON.stringify(searchTask)
  });
  console.log(`Status: ${res1.status} ${res1.statusText}`);
  const task1Data = await res1.json();
  console.log('Task Response:', JSON.stringify(task1Data));

  if (!task1Data.job_id) {
    console.error('No job_id returned for search task!');
    return;
  }

  const jobId1 = task1Data.job_id;
  let job1Result = null;
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const pollRes = await fetch(`${baseUrl}/v1/wire/jobs/${jobId1}`, { headers });
    const jobData = await pollRes.json();
    console.log(`Poll ${i+1}: status = ${jobData.status}`);
    if (jobData.status === 'completed') {
      job1Result = jobData.result;
      console.log('Search Result:', JSON.stringify(job1Result, null, 2));
      break;
    } else if (jobData.status === 'failed') {
      console.log('Search Job Failed:', JSON.stringify(jobData.error, null, 2));
      break;
    }
  }

  // Also check dmc_list_products
  console.log('\n[2. LIST PRODUCTS] Submitting dmc_list_products task...');
  const listTask = {
    action_id: 'dmc_list_products',
    parameters: {
      max_pages: 1
    }
  };

  const res2 = await fetch(`${baseUrl}/v1/wire/task`, {
    method: 'POST',
    headers,
    body: JSON.stringify(listTask)
  });
  console.log(`Status: ${res2.status} ${res2.statusText}`);
  const task2Data = await res2.json();
  console.log('Task Response:', JSON.stringify(task2Data));

  if (task2Data.job_id) {
    const jobId2 = task2Data.job_id;
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const pollRes = await fetch(`${baseUrl}/v1/wire/jobs/${jobId2}`, { headers });
      const jobData = await pollRes.json();
      console.log(`Poll ${i+1}: status = ${jobData.status}`);
      if (jobData.status === 'completed') {
        console.log('List Result Sample:', JSON.stringify(jobData.result, null, 2).slice(0, 1000));
        break;
      } else if (jobData.status === 'failed') {
        console.log('List Job Failed:', JSON.stringify(jobData.error, null, 2));
        break;
      }
    }
  }
}

testDumcoWire().catch(console.error);
