import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productQuery, targetPrice, currency = 'INR' } = body;

    const monitorJob = {
      id: `mon_${Date.now()}`,
      productQuery: productQuery || 'Sony WH-1000XM5',
      targetPrice: targetPrice || 25000,
      currency,
      status: 'ACTIVE_MONITORING',
      intervalMinutes: 15,
      createdAt: new Date().toISOString(),
      message: `Anakin Wire price monitor activated. Agent will check catalog price every 15 minutes and execute auto-cart when ${currency} ${targetPrice} constraint is met.`,
    };

    return NextResponse.json({
      success: true,
      monitor: monitorJob,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}
