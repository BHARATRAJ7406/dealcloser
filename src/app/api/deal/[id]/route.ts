import { NextResponse } from 'next/server';
import { AgentOrchestrator } from '@/lib/agent/orchestrator';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: runId } = await params;
    const runState = AgentOrchestrator.getRunState(runId);

    if (!runState) {
      return NextResponse.json(
        { success: false, error: 'Run ID not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      run: runState,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}
