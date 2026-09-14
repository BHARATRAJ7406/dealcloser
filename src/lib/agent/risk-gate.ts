import { ProductCandidate, RiskGateAuthorization, ShoppingIntent } from '../types/agent';

export class RiskGate {
  /**
   * Evaluate safety policy and issue strict action authorization object
   */
  static evaluate(
    intent: ShoppingIntent,
    candidate: ProductCandidate,
  ): RiskGateAuthorization {
    const evaluatedAt = new Date().toISOString();

    // Safety Audit Check 1: Price Check
    if (candidate.price > intent.maxPrice) {
      return {
        approved: false,
        action: 'ADD_TO_CART',
        productUrl: candidate.url,
        expectedTitle: candidate.title,
        expectedPrice: candidate.price,
        quantity: intent.quantity,
        maxPrice: intent.maxPrice,
        reason: `RISK REJECTED: Candidate price ${candidate.currency} ${candidate.price} exceeds max price limit ${intent.currency} ${intent.maxPrice}`,
        evaluatedAt,
      };
    }

    // Safety Audit Check 2: Availability Check
    if (!candidate.inStock) {
      return {
        approved: false,
        action: 'ADD_TO_CART',
        productUrl: candidate.url,
        expectedTitle: candidate.title,
        expectedPrice: candidate.price,
        quantity: intent.quantity,
        maxPrice: intent.maxPrice,
        reason: 'RISK REJECTED: Selected candidate is out of stock.',
        evaluatedAt,
      };
    }

    // Safety Audit Check 3: Action Policy Enforcement
    if (!intent.autoAddToCart || intent.actionPolicy !== 'add_to_cart_if_under_limit') {
      return {
        approved: false,
        action: 'ADD_TO_CART',
        productUrl: candidate.url,
        expectedTitle: candidate.title,
        expectedPrice: candidate.price,
        quantity: intent.quantity,
        maxPrice: intent.maxPrice,
        reason: 'RISK REJECTED: Autonomous action policy is set to MANUAL/ASK.',
        evaluatedAt,
      };
    }

    return {
      approved: true,
      action: 'ADD_TO_CART',
      productUrl: candidate.url,
      expectedTitle: candidate.title,
      expectedPrice: candidate.price,
      quantity: intent.quantity,
      maxPrice: intent.maxPrice,
      reason: `RISK PASSED: Action is strictly ADD_TO_CART. Price ${candidate.currency} ${candidate.price.toLocaleString()} is within user limit ${intent.currency} ${intent.maxPrice.toLocaleString()}. No financial/payment transaction permitted.`,
      evaluatedAt,
    };
  }
}
