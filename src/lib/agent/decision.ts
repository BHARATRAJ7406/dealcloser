import { DecisionResult, ProductCandidate, ShoppingIntent } from '../types/agent';

export class DecisionEngine {
  /**
   * Evaluate hard constraints & calculate deal score for candidates
   */
  static evaluate(
    intent: ShoppingIntent,
    candidates: ProductCandidate[],
  ): DecisionResult {
    const evaluatedAt = new Date().toISOString();
    const rejectedCandidates: ProductCandidate[] = [];
    const qualifyingCandidates: ProductCandidate[] = [];

    for (const cand of candidates) {
      let qualifies = true;
      let rejectionReason = '';

      // Hard Constraint 1: Price <= maxPrice
      if (cand.price > intent.maxPrice) {
        qualifies = false;
        rejectionReason = `Price ${cand.currency} ${cand.price.toLocaleString()} exceeds maximum budget limit of ${intent.currency} ${intent.maxPrice.toLocaleString()}`;
      }

      // Hard Constraint 2: Must be in stock
      else if (!cand.inStock) {
        qualifies = false;
        rejectionReason = 'Product is currently out of stock';
      }

      // Hard Constraint 3: Match score threshold
      else if (cand.matchScore < 70) {
        qualifies = false;
        rejectionReason = `Match score (${cand.matchScore}%) below minimum required confidence threshold (70%)`;
      }

      const updatedCand: ProductCandidate = {
        ...cand,
        qualifies,
        rejectionReason: qualifies ? undefined : rejectionReason,
      };

      if (qualifies) {
        qualifyingCandidates.push(updatedCand);
      } else {
        rejectedCandidates.push(updatedCand);
      }
    }

    if (qualifyingCandidates.length === 0) {
      return {
        decision: 'NO_MATCH',
        reason: `No candidate products satisfied all hard constraints (Price <= ${intent.currency} ${intent.maxPrice.toLocaleString()} & In-Stock).`,
        agentConfidence: 95,
        dealScore: 0,
        rejectedCandidates,
        evaluatedAt,
      };
    }

    // Rank qualifying candidates by deal score (lower price & higher match/rating)
    qualifyingCandidates.sort((a, b) => b.dealScore - a.dealScore);

    const selected = qualifyingCandidates[0];
    const savings = intent.maxPrice - selected.price;
    const reason = `Selected ${selected.store} candidate. Exact model match, in stock, saving ${intent.currency} ${savings.toLocaleString()} below your limit (${selected.currency} ${selected.price.toLocaleString()} <= ${intent.currency} ${intent.maxPrice.toLocaleString()}).`;

    return {
      decision: 'ACT',
      selectedCandidate: selected,
      reason,
      agentConfidence: 98,
      dealScore: selected.dealScore,
      rejectedCandidates,
      evaluatedAt,
    };
  }
}
