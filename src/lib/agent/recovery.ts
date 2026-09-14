import { DecisionResult, ProductCandidate, ShoppingIntent } from '../types/agent';
import { RiskGate } from './risk-gate';
import { AgentExecutor } from './executor';
import { AgentVerifier } from './verifier';

export class RecoveryEngine {
  /**
   * Attempt genuine agentic recovery if Store A cart or verification fails
   */
  static async attemptRecovery(
    intent: ShoppingIntent,
    decision: DecisionResult,
  ) {
    console.log('[RecoveryEngine] Initiating fallback candidate evaluation...');
    const candidates = decision.rejectedCandidates.filter(c => c.inStock && c.price <= intent.maxPrice);

    if (candidates.length === 0) {
      return { recovered: false, reason: 'No backup candidate satisfied hard constraints.' };
    }

    const fallbackCandidate = candidates[0];
    console.log(`[RecoveryEngine] Selected fallback candidate: ${fallbackCandidate.store} - ${fallbackCandidate.title}`);

    const auth = RiskGate.evaluate(intent, fallbackCandidate);
    if (!auth.approved) {
      return { recovered: false, reason: `Fallback risk rejected: ${auth.reason}` };
    }

    const actResult = await AgentExecutor.executeAction(auth);
    const verifyResult = await AgentVerifier.verifyCartState(actResult, auth);

    return {
      recovered: verifyResult.verified,
      fallbackCandidate,
      actResult,
      verifyResult,
    };
  }
}
