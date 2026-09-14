import { AnakinBrowserService } from '../anakin/browser';
import { ActResult, RiskGateAuthorization } from '../types/agent';

export class AgentExecutor {
  /**
   * Execute real web add-to-cart mutation using Anakin Browser API
   */
  static async executeAction(auth: RiskGateAuthorization): Promise<ActResult> {
    if (!auth.approved) {
      throw new Error(`Executor blocked: ${auth.reason}`);
    }

    console.log(`[Executor] Executing authorized ADD_TO_CART for ${auth.productUrl}...`);
    return AnakinBrowserService.executeAddToCart(auth.productUrl, 'Flipkart');
  }
}
