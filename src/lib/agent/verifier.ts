import { AnakinBrowserService } from '../anakin/browser';
import { ActResult, RiskGateAuthorization, VerificationResult } from '../types/agent';

export class AgentVerifier {
  /**
   * Perform independent cart state verification pass
   */
  static async verifyCartState(
    actResult: ActResult,
    auth: RiskGateAuthorization,
  ): Promise<VerificationResult> {
    console.log(`[Verifier] Independently inspecting retail cart at ${actResult.cartUrl}...`);

    return AnakinBrowserService.verifyCart(
      actResult.cartUrl,
      auth.expectedTitle,
      auth.expectedPrice,
      actResult.store,
      actResult.cartCookies ?? [],
    );
  }
}
