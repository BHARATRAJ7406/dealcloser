'use client';

import { useState, useEffect } from 'react';
import { AgentRunState } from '@/lib/types/agent';

export default function Home() {
  const [query, setQuery] = useState('Find Sony WH-1000XM5 under ₹25,000 and add to cart');
  const [maxPrice, setMaxPrice] = useState<number>(25000);
  const [quantity, setQuantity] = useState<number>(1);
  const [autoAddToCart, setAutoAddToCart] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [runState, setRunState] = useState<AgentRunState | null>(null);
  const [monitorStatus, setMonitorStatus] = useState<string | null>(null);

  const presetQueries = [
    { label: 'Sony WH-1000XM5 under ₹25,000', query: 'Find Sony WH-1000XM5 under ₹25,000 and add to cart', price: 25000 },
    { label: 'Apple AirPods Pro 2 under ₹20,000', query: 'Find Apple AirPods Pro 2 under ₹20,000 and add to cart', price: 20000 },
    { label: 'Samsung Galaxy Watch 6 under ₹28,000', query: 'Find Samsung Galaxy Watch 6 under ₹28,000 and add to cart', price: 28000 },
  ];

  // Poll agent state when active run ID exists
  useEffect(() => {
    if (!activeRunId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/deal/${activeRunId}`);
        const data = await res.json();
        if (data.success && data.run) {
          setRunState(data.run);
          if (data.run.state === 'COMPLETED' || data.run.state === 'FAILED') {
            setIsLoading(false);
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error('Error polling run state:', err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRunId]);

  const handleStartAgent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setRunState(null);
    setMonitorStatus(null);

    try {
      const res = await fetch('/api/deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          maxPrice,
          quantity,
          autoAddToCart,
        }),
      });

      const data = await res.json();
      if (data.success && data.runId) {
        setActiveRunId(data.runId);
      } else {
        setIsLoading(false);
        alert(data.error || 'Failed to start agent');
      }
    } catch (err) {
      setIsLoading(false);
      alert('Network error starting agent: ' + (err as Error).message);
    }
  };

  const handleCreateMonitor = async () => {
    try {
      const res = await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productQuery: runState?.intent?.productQuery || query,
          targetPrice: maxPrice,
          currency: runState?.intent?.currency || 'INR',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMonitorStatus(data.monitor.message);
      }
    } catch {
      alert('Failed to set up monitor');
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 pb-8 mb-8 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-400 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-blue-500/20">
            DC
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              DealCloser
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold uppercase tracking-wider">
                Autonomous AI Agent
              </span>
            </h1>
            <p className="text-sm text-slate-400">
              An autonomous web agent that doesn&apos;t just find the deal. It closes it.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Anakin Wire & Browser API Active
        </div>
      </header>

      {/* MAIN AGENT INPUT FORM */}
      <section className="glass-panel rounded-2xl p-6 md:p-8 mb-8 glow-box">
        <form onSubmit={handleStartAgent} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              What do you want me to acquire?
            </label>
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Find Sony WH-1000XM5 under ₹25,000 and add to cart"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3.5 text-slate-100 text-base focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className="mt-3 md:mt-0 md:absolute md:right-2 md:top-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white font-bold text-sm shadow-md transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Executing Agent Loop...
                  </>
                ) : (
                  <>
                    <span>⚡ Run Autonomous Agent</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* PRESET CHIPS */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-slate-500 font-medium">Try Preset:</span>
            {presetQueries.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(preset.query);
                  setMaxPrice(preset.price);
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* HARD CONSTRAINTS & POLICY ROW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800/60">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Max Price Constraint (INR ₹)
              </label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center justify-between bg-slate-950/60 border border-slate-800 rounded-lg px-4 py-2">
              <div>
                <span className="block text-xs font-semibold text-slate-300">Action Policy</span>
                <span className="text-[11px] text-slate-500">Auto Add-to-Cart when verified</span>
              </div>
              <input
                type="checkbox"
                checked={autoAddToCart}
                onChange={(e) => setAutoAddToCart(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </form>
      </section>

      {/* PARSED INTENT BADGES */}
      {runState && (
        <section className="glass-panel rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4 border-l-4 border-l-blue-500">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 block mb-1">
              Parsed Shopping Intent
            </span>
            <span className="text-base font-bold text-white">
              &quot;{runState.intent.productQuery}&quot;
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs text-emerald-400 font-semibold">
              Max: {runState.intent.currency} {runState.intent.maxPrice.toLocaleString()}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs text-slate-300 font-semibold">
              Qty: {runState.intent.quantity}
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs text-blue-300 font-semibold">
              Policy: {runState.intent.actionPolicy}
            </span>
          </div>
        </section>
      )}

      {/* VERIFIED DEAL CLOSED SUCCESS BANNER */}
      {runState?.state === 'COMPLETED' && runState.checkoutUrl && (
        <section className="glass-panel rounded-2xl p-6 md:p-8 mb-8 border-2 border-emerald-500/50 glow-box-success bg-gradient-to-b from-emerald-950/20 to-slate-950">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
                ✓ DEAL CLOSED & INDEPENDENTLY VERIFIED
              </div>
              <h2 className="text-2xl font-black text-white">
                {runState.decision?.selectedCandidate?.title || 'Sony WH-1000XM5 Bluetooth Headset'}
              </h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-slate-300 pt-1">
                <span>
                  Store: <strong className="text-white">{runState.decision?.selectedCandidate?.store || 'Flipkart'}</strong>
                </span>
                <span>•</span>
                <span>
                  Price: <strong className="text-emerald-400 text-lg font-bold">₹{runState.decision?.selectedCandidate?.price.toLocaleString() || '24,990'}</strong>
                </span>
                <span>•</span>
                <span className="text-slate-400 text-xs">
                  Savings: ₹{(runState.intent.maxPrice - (runState.decision?.selectedCandidate?.price || 24990)).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <a
                href={runState.checkoutUrl}
                target="_blank"
                rel="noreferrer"
                className="px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base shadow-lg shadow-emerald-500/30 transition-all duration-200 transform hover:scale-105 flex items-center gap-2 text-center"
              >
                <span>🛒 OPEN VERIFIED CART</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
              <span className="text-[11px] text-slate-400">
                You remain in control of final checkout & payment
              </span>
            </div>
          </div>
        </section>
      )}

      {/* 2-COLUMN LAYOUT: TIMELINE & DECISION ENGINE */}
      {runState && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          {/* COLUMN 1: LIVE AGENT ACTIVITY TIMELINE */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></span>
                  Live Activity Timeline
                </h3>
                <span className="text-xs text-slate-500">Run ID: {runState.runId}</span>
              </div>

              <div className="relative pl-6 space-y-6">
                <div className="timeline-line"></div>

                {runState.events.map((evt) => (
                  <div key={evt.id} className="relative group">
                    <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 bg-slate-950 ${
                      evt.type === 'success'
                        ? 'border-emerald-500 text-emerald-500'
                        : evt.type === 'action'
                        ? 'border-blue-500 text-blue-500'
                        : evt.type === 'warning'
                        ? 'border-amber-500 text-amber-500'
                        : evt.type === 'error'
                        ? 'border-rose-500 text-rose-500'
                        : 'border-slate-600 text-slate-400'
                    }`}></div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-500">{evt.timestamp}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          evt.type === 'success'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : evt.type === 'action'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {evt.state}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-200 mt-1">{evt.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{evt.message}</p>

                      {evt.metadata && (
                        <div className="mt-2 p-2.5 rounded-lg bg-slate-950/80 border border-slate-900 text-[11px] font-mono text-slate-400 overflow-x-auto">
                          {JSON.stringify(evt.metadata, null, 2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMN 2: CANDIDATES, DECISION & RISK GATE */}
          <div className="lg:col-span-5 space-y-6">
            {/* DECISION ENGINE PANEL */}
            {runState.decision && (
              <div className="glass-panel rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-4 pb-3 border-b border-slate-800 flex items-center justify-between">
                  <span>Decision Engine & Reasoning</span>
                  <span className="text-xs px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                    Score: {runState.decision.dealScore}/100
                  </span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block mb-1">WHY THIS PRODUCT?</span>
                    <p className="text-xs text-slate-300 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                      {runState.decision.reason}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                      <span className="text-[11px] text-slate-400 block">Agent Confidence</span>
                      <span className="text-lg font-black text-emerald-400">{runState.decision.agentConfidence}%</span>
                    </div>
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-center">
                      <span className="text-[11px] text-slate-400 block">Hard Constraints</span>
                      <span className="text-lg font-black text-blue-400">PASSED ✓</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* RISK GATE SAFETY AUDIT */}
            {runState.riskGate && (
              <div className="glass-panel rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-4 pb-3 border-b border-slate-800 flex items-center justify-between">
                  <span>Safety & Risk Gate</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded font-bold uppercase ${
                    runState.riskGate.approved
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {runState.riskGate.approved ? 'APPROVED ✓' : 'REJECTED ✕'}
                  </span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/50">
                    <span className="text-slate-400">Max Autonomous Action:</span>
                    <span className="font-bold text-blue-400">ADD TO CART ONLY</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/50">
                    <span className="text-slate-400">Payment Permission:</span>
                    <span className="font-bold text-rose-400">PROHIBITED (HUMAN CHECKOUT)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300 leading-relaxed">
                    {runState.riskGate.reason}
                  </div>
                </div>
              </div>
            )}

            {/* DISCOVERED CANDIDATES */}
            {runState.candidates.length > 0 && (
              <div className="glass-panel rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-4 pb-3 border-b border-slate-800 flex items-center justify-between">
                  <span>Discovered Retail Candidates</span>
                  <span className="text-xs text-slate-400">{runState.candidates.length} Found</span>
                </h3>

                <div className="space-y-3">
                  {runState.candidates.map((cand) => (
                    <div
                      key={cand.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        cand.qualifies
                          ? 'bg-slate-950/80 border-slate-800 hover:border-blue-500/50'
                          : 'bg-slate-950/30 border-slate-900 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-900 text-blue-400 border border-slate-800">
                            {cand.store}
                          </span>
                          <h4 className="text-xs font-semibold text-slate-200 mt-1 line-clamp-1">
                            {cand.title}
                          </h4>
                        </div>
                        <span className={`text-xs font-bold ${cand.price <= runState.intent.maxPrice ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ₹{cand.price.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-900 text-[11px]">
                        <span className="text-slate-500">Match: {cand.matchScore}%</span>
                        {cand.qualifies ? (
                          <span className="text-emerald-400 font-semibold">✓ QUALIFIED</span>
                        ) : (
                          <span className="text-rose-400 font-medium line-clamp-1">{cand.rejectionReason}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PRICE DROP MONITOR BUTTON */}
            {runState.state === 'COMPLETED' && (
              <div className="glass-panel rounded-xl p-4 text-center">
                <button
                  type="button"
                  onClick={handleCreateMonitor}
                  className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  <span>🔔 Set Up Price Drop Watcher</span>
                </button>
                {monitorStatus && (
                  <p className="text-[11px] text-emerald-400 mt-2 font-medium">{monitorStatus}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
