import { z } from 'zod';

export type AgentState =
  | 'INTENT_RECEIVED'
  | 'DISCOVERING'
  | 'READING'
  | 'EVALUATING'
  | 'WAITING_FOR_CONSTRAINT'
  | 'ACTING'
  | 'VERIFYING'
  | 'RECOVERING'
  | 'COMPLETED'
  | 'FAILED';

export const ShoppingIntentSchema = z.object({
  productQuery: z.string().min(1, 'Product query is required'),
  maxPrice: z.number().positive('Max price must be greater than 0'),
  currency: z.string().default('INR'),
  quantity: z.number().int().min(1).default(1),
  preferredBrand: z.string().optional(),
  preferredColor: z.string().optional(),
  condition: z.enum(['new', 'refurbished', 'any']).default('new'),
  autoAddToCart: z.boolean().default(true),
  actionPolicy: z.literal('add_to_cart_if_under_limit').default('add_to_cart_if_under_limit'),
});

export type ShoppingIntent = z.infer<typeof ShoppingIntentSchema>;

export interface ProductCandidate {
  id: string;
  store: string;
  title: string;
  price: number;
  currency: string;
  inStock: boolean;
  url: string;
  imageUrl?: string;
  rating?: number;
  matchScore: number; // 0 to 100
  dealScore: number;  // 0 to 100
  qualifies: boolean;
  rejectionReason?: string;
}

export interface DecisionResult {
  decision: 'ACT' | 'NO_MATCH' | 'HALT_HIGH_RISK';
  selectedCandidate?: ProductCandidate;
  reason: string;
  agentConfidence: number; // 0 to 100%
  dealScore: number;
  rejectedCandidates: ProductCandidate[];
  evaluatedAt: string;
}

export interface RiskGateAuthorization {
  approved: boolean;
  action: 'ADD_TO_CART';
  store: string;
  productUrl: string;
  expectedTitle: string;
  expectedPrice: number;
  quantity: number;
  maxPrice: number;
  reason: string;
  evaluatedAt: string;
}

export interface ActResult {
  success: boolean;
  action: 'ADD_TO_CART';
  store: string;
  productUrl: string;
  cartUrl: string;
  timestamp: string;
  logs: string[];
  error?: string;
}

export interface VerificationResult {
  verified: boolean;
  store: string;
  cartUrl: string;
  verifiedTitle?: string;
  verifiedPrice?: number;
  verifiedQuantity?: number;
  matchedProduct: boolean;
  matchedPrice: boolean;
  timestamp: string;
  evidence: Record<string, unknown>;
  error?: string;
}

export interface AgentEvent {
  id: string;
  timestamp: string;
  state: AgentState;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'action';
  metadata?: Record<string, unknown>;
}

export interface EvidenceNode {
  id: string;
  source: string;
  field: string;
  value: string | number | boolean;
  retrievedAt: string;
  verified: boolean;
}

export interface AgentRunState {
  runId: string;
  createdAt: string;
  updatedAt: string;
  state: AgentState;
  intent: ShoppingIntent;
  events: AgentEvent[];
  candidates: ProductCandidate[];
  decision?: DecisionResult;
  riskGate?: RiskGateAuthorization;
  actResult?: ActResult;
  verificationResult?: VerificationResult;
  checkoutUrl?: string;
  error?: string;
  evidenceGraph: EvidenceNode[];
}
