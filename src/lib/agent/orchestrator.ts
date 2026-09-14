import { v4 as uuidv4 } from 'uuid';
import {
  AgentEvent,
  AgentRunState,
  AgentState,
  EvidenceNode,
  ShoppingIntent,
} from '../types/agent';
import { IntentParser } from './intent';
import { DiscoveryEngine } from './discovery';
import { DecisionEngine } from './decision';
import { RiskGate } from './risk-gate';
import { AgentExecutor } from './executor';
import { AgentVerifier } from './verifier';
import { RecoveryEngine } from './recovery';

// In-memory run state storage
const runStore = new Map<string, AgentRunState>();

export class AgentOrchestrator {
  /**
   * Get agent run state by run ID
   */
  static getRunState(runId: string): AgentRunState | undefined {
    return runStore.get(runId);
  }

  /**
   * Start asynchronous DealCloser agent acquisition loop
   */
  static async startRun(rawQuery: string, options: Partial<ShoppingIntent> = {}): Promise<AgentRunState> {
    const runId = `run_${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();

    const intent = IntentParser.parse(rawQuery, options);

    const initialState: AgentRunState = {
      runId,
      createdAt: now,
      updatedAt: now,
      state: 'INTENT_RECEIVED',
      intent,
      events: [],
      candidates: [],
      evidenceGraph: [],
    };

    runStore.set(runId, initialState);
    this.addEvent(runId, 'INTENT_RECEIVED', 'Parsed Shopping Intent', `Product: "${intent.productQuery}" | Max Price: ${intent.currency} ${intent.maxPrice.toLocaleString()} | Policy: Auto-Add to Cart`, 'info');

    // Await agent pipeline execution to complete before returning state
    try {
      await this.executePipeline(runId);
    } catch (err) {
      console.error(`[Orchestrator] Run ${runId} execution error:`, err);
    }

    return runStore.get(runId)!;
  }

  private static addEvent(
    runId: string,
    state: AgentState,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' | 'action',
    metadata?: Record<string, unknown>,
  ) {
    const run = runStore.get(runId);
    if (!run) return;

    const event: AgentEvent = {
      id: `evt_${uuidv4().slice(0, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      state,
      title,
      message,
      type,
      metadata,
    };

    run.state = state;
    run.updatedAt = new Date().toISOString();
    run.events.push(event);

    // Add evidence node if metadata provided
    if (metadata) {
      const node: EvidenceNode = {
        id: `ev_${uuidv4().slice(0, 6)}`,
        source: (metadata.source as string) || 'Anakin Engine',
        field: title,
        value: message,
        retrievedAt: new Date().toISOString(),
        verified: type === 'success',
      };
      run.evidenceGraph.push(node);
    }
  }

  private static async executePipeline(runId: string) {
    const run = runStore.get(runId);
    if (!run) return;

    try {
      // 1. DISCOVERY & READ
      this.addEvent(runId, 'DISCOVERING', 'Querying Anakin Wire Catalog', `Searching live retailer catalog via Wire API (fk_search_products)...`, 'info');
      await new Promise((r) => setTimeout(r, 600));

      const { candidates, rawEvidence } = await DiscoveryEngine.discoverCandidates(run.intent);
      run.candidates = candidates;

      this.addEvent(
        runId,
        'READING',
        'Retrieved Live Product Metadata',
        `Discovered ${candidates.length} candidate listings across Flipkart, Best Buy, and Walmart.`,
        'success',
        { source: 'Anakin Wire Catalog', rawEvidence },
      );
      await new Promise((r) => setTimeout(r, 600));

      // 2. DECISION ENGINE & EVALUATION
      this.addEvent(runId, 'EVALUATING', 'Evaluating Hard Constraints & Scoring', `Checking hard constraints: Price <= ${run.intent.currency} ${run.intent.maxPrice.toLocaleString()}, In-Stock = True, Product Match >= 70%`, 'info');
      await new Promise((r) => setTimeout(r, 600));

      const decision = DecisionEngine.evaluate(run.intent, candidates);
      run.decision = decision;

      if (decision.decision === 'NO_MATCH' || !decision.selectedCandidate) {
        this.addEvent(runId, 'FAILED', 'No Candidate Satisfied Constraints', decision.reason, 'error');
        return;
      }

      this.addEvent(
        runId,
        'WAITING_FOR_CONSTRAINT',
        'Selected Top Qualifying Deal',
        `Winning store: ${decision.selectedCandidate.store} | Title: "${decision.selectedCandidate.title}" | Price: ${decision.selectedCandidate.currency} ${decision.selectedCandidate.price.toLocaleString()} (Agent Confidence: ${decision.agentConfidence}%)`,
        'success',
        { candidate: decision.selectedCandidate, dealScore: decision.dealScore },
      );
      await new Promise((r) => setTimeout(r, 600));

      // 3. RISK GATE
      const auth = RiskGate.evaluate(run.intent, decision.selectedCandidate);
      run.riskGate = auth;

      if (!auth.approved) {
        this.addEvent(runId, 'FAILED', 'Risk Gate Audit Failed', auth.reason, 'warning');
        return;
      }

      this.addEvent(
        runId,
        'ACTING',
        'Risk Gate Approved Autonomous Mutation',
        auth.reason,
        'action',
        { authorization: auth },
      );
      await new Promise((r) => setTimeout(r, 600));

      // 4. BROWSER ACT (Add to Cart)
      this.addEvent(runId, 'ACTING', 'Executing Web Cart Mutation', `Connecting Anakin Browser API (wss://api.anakin.io/v1/browser-connect) -> Navigating to ${decision.selectedCandidate.store} product page...`, 'action');

      const actResult = await AgentExecutor.executeAction(auth);
      run.actResult = actResult;

      this.addEvent(
        runId,
        'VERIFYING',
        'Cart Mutation Executed',
        `Add-to-cart button triggered on ${decision.selectedCandidate.store} DOM. Initiating independent verification pass.`,
        'info',
        { actResult },
      );
      await new Promise((r) => setTimeout(r, 600));

      // 5. INDEPENDENT VERIFICATION
      const verification = await AgentVerifier.verifyCartState(actResult, auth);
      run.verificationResult = verification;

      if (verification.verified) {
        run.checkoutUrl = actResult.cartUrl;
        this.addEvent(
          runId,
          'COMPLETED',
          'DEAL CLOSED & INDEPENDENTLY VERIFIED',
          `Successfully verified ${decision.selectedCandidate.title} inside ${decision.selectedCandidate.store} cart at ${decision.selectedCandidate.currency} ${decision.selectedCandidate.price.toLocaleString()} (Qty: 1). Verified cart link generated.`,
          'success',
          { verification, checkoutUrl: actResult.cartUrl },
        );
      } else {
        // Attempt Recovery if initial verification fails
        this.addEvent(runId, 'RECOVERING', 'Attempting Agentic Recovery', 'Primary verification encountered discrepancy. Retrying fallback candidate evaluation...', 'warning');
        const recovery = await RecoveryEngine.attemptRecovery(run.intent, decision);

        if (recovery.recovered && recovery.actResult) {
          run.checkoutUrl = recovery.actResult.cartUrl;
          this.addEvent(
            runId,
            'COMPLETED',
            'DEAL CLOSED VIA RECOVERY FALLBACK',
            `Successfully recovered via fallback candidate! Cart verified at ${recovery.actResult.cartUrl}.`,
            'success',
          );
        } else {
          this.addEvent(runId, 'FAILED', 'Verification Failed', 'Could not independently verify cart contents.', 'error');
        }
      }
    } catch (err) {
      this.addEvent(runId, 'FAILED', 'Agent Execution Exception', (err as Error).message, 'error');
    }
  }
}
