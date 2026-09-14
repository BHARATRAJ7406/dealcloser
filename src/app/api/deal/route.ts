import { NextResponse } from 'next/server';
import { AgentOrchestrator } from '@/lib/agent/orchestrator';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = body.query || body.input || 'Find Sony WH-1000XM5 under ₹25,000 and add to cart';
    const maxPrice = body.maxPrice ? parseFloat(body.maxPrice) : undefined;
    const autoAddToCart = body.autoAddToCart !== false;

    console.log(`[API /api/deal] Starting agent run for query: "${query}"`);
    const runState = await AgentOrchestrator.startRun(query, {
      maxPrice,
      autoAddToCart,
    });

    return NextResponse.json({
      success: true,
      runId: runState.runId,
      state: runState.state,
      intent: runState.intent,
      message: 'DealCloser agent initialized and running.',
    });
  } catch (err) {
    console.error('[API /api/deal Error]:', err);
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}
