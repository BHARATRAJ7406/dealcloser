import fs from 'fs';
import path from 'path';
import { AgentOrchestrator } from '../src/lib/agent/orchestrator.ts';

// Load .env variables
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const [key, ...val] = line.split('=');
  if (key && val.length > 0) {
    process.env[key.trim()] = val.join('=').trim();
  }
}

async function testProductionPipeline() {
  console.log('=== TESTING DEALCLOSER PRODUCTION AGENT ORCHESTRATOR PIPELINE ===');
  const query = 'Find Partake Foods Classic Grahams under $50 and add to cart';
  console.log(`Input Query: "${query}"`);

  // Start production orchestrator run
  const initialRunState = await AgentOrchestrator.startRun(query, { maxPrice: 50, autoAddToCart: true });
  console.log(`Run Initialized! Run ID: ${initialRunState.runId}`);
  console.log(`Initial State: ${initialRunState.state}`);

  // Poll run state until COMPLETED or FAILED
  let finalState = initialRunState;
  const startTime = Date.now();
  while (Date.now() - startTime < 60000) {
    await new Promise(r => setTimeout(r, 2000));
    const current = AgentOrchestrator.getRunState(initialRunState.runId);
    if (current) {
      finalState = current;
      console.log(`[Poll] State: ${current.state} | Events: ${current.events.length} | Graph Nodes: ${current.evidenceGraph.length}`);
      if (current.state === 'COMPLETED' || current.state === 'FAILED') {
        break;
      }
    }
  }

  console.log('\n=== FINAL PRODUCTION RUN STATE ===');
  console.log(`Final State: ${finalState.state}`);
  console.log('\nEvents Trace:');
  for (const evt of finalState.events) {
    console.log(` [${evt.timestamp}] [${evt.state}] ${evt.title}: ${evt.message}`);
  }

  console.log('\nDecision Candidate Selected:');
  console.log(JSON.stringify(finalState.decision?.selectedCandidate, null, 2));

  console.log('\nRisk Gate Authorization:');
  console.log(JSON.stringify(finalState.riskGate, null, 2));

  console.log('\nAct Result:');
  console.log(JSON.stringify(finalState.actResult, null, 2));

  console.log('\nVerification Result:');
  console.log(JSON.stringify(finalState.verificationResult, null, 2));

  console.log('\nEvidence Graph:');
  console.log(JSON.stringify(finalState.evidenceGraph, null, 2));
}

testProductionPipeline().catch(console.error);
