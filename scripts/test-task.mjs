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

async function testTaskExecution() {
  console.log('Testing Wire task execution...');

  // Let's test camelcamelcamel price history (ASIN B00CP8DF3O or B09XS7JWHH which is Sony WH-1000XM5)
  const taskPayload = {
    action_id: 'act_camelcamelcamel_product_price_history_detail',
    parameters: {
      asin: 'B09XS7JWHH', // Sony WH-1000XM5
      tp: '3m'
    }
  };

  console.log('1. Submitting POST /v1/wire/task:', JSON.stringify(taskPayload));
  const res = await fetch(`${baseUrl}/v1/wire/task`, {
    method: 'POST',
    headers,
    body: JSON.stringify(taskPayload)
  });
  
  console.log('Task Submission Status:', res.status, res.statusText);
  const taskRes = await res.json();
  console.log('Task Response:', JSON.stringify(taskRes));

  if (taskRes.job_id || taskRes.id) {
    const jobId = taskRes.job_id || taskRes.id;
    console.log(`\n2. Polling GET /v1/wire/jobs/${jobId}...`);
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const jobRes = await fetch(`${baseUrl}/v1/wire/jobs/${jobId}`, { headers });
      const jobData = await jobRes.json();
      console.log(` Poll ${i + 1}: Status = ${jobData.status || jobData.job?.status}`);
      if (jobData.status === 'completed' || jobData.job?.status === 'completed') {
        console.log('\nSUCCESS! Result:');
        console.log(JSON.stringify(jobData.result || jobData.job?.result, null, 2).slice(0, 1000));
        break;
      }
      if (jobData.status === 'failed' || jobData.job?.status === 'failed') {
        console.log('\nFAILED! Error:', JSON.stringify(jobData.error || jobData.job?.error));
        break;
      }
    }
  }
}

testTaskExecution();
