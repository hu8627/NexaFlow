import React, { useState } from 'react';
import { Lightbulb, Database, ChevronRight, CheckCircle2, XCircle, Beaker } from 'lucide-react';

export default function InsightsHub() {
  const [genes] = useState([
    {
      id: 'gene_088', source: 'Ticket-9921', targetAgent: 'Agent_Code_Reviewer',
      signal: '人类在处理挂起工单时，连续 3 次手动将 [max_tokens] 参数从 2048 修改为了 4096。',
      gene: '处理复杂的深度嵌套 React 组件审核时，必须预留至少 4000 Token 的上下文窗口。',
      status: 'pending_approval'
    }
  ]);

  return (
    <div className="p-8 h-full overflow-y-auto bg-[#0B0F19] text-slate-200 w-full">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Lightbulb className="text-amber-500" /> Evolution Insights (进化基因)</h1>
          <p className="text-xs text-slate-500 mt-1.5">将底层的错误信号 (Signals) 提纯为可复用的知识基因 (Genes)。批准后将合入 Agent 的记忆库。</p>
        </div>
      </div>

      <div className="space-y-6">
        {genes.map((g) => (
          <div key={g.id} className="bg-[#0E121B] border border-amber-500/30 rounded-2xl p-6 shadow-[0_4px_20px_rgba(245,158,11,0.05)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
            
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-amber-900/20 text-amber-500 flex items-center justify-center border border-amber-500/30"><Beaker size={16}/></div>
                <div>
                  <div className="text-[10px] font-mono text-slate-500 mb-0.5">Extracted from {g.source}</div>
                  <h3 className="font-bold text-sm text-slate-200">Target: {g.targetAgent}</h3>
                </div>
              </div>
            </div>

            <div className="bg-[#050505] rounded-xl border border-slate-800 p-4 mb-4 space-y-4 shadow-inner">
              <div>
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Raw Signal (原始信号)</div>
                <div className="text-xs text-slate-400">{g.signal}</div>
              </div>
              <div className="pt-3 border-t border-slate-800/60">
                <div className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-1.5">Synthesized Gene (提纯基因)</div>
                <div className="text-xs text-amber-300 font-mono bg-amber-950/20 p-2 rounded border border-amber-900/30">{g.gene}</div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 bg-emerald-900/20 hover:bg-emerald-900/40 text-emerald-400 border border-emerald-900/50 text-[11px] font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                <CheckCircle2 size={14}/> Approve & Merge to Memory
              </button>
              <button className="flex-1 bg-slate-800/50 hover:bg-slate-700 text-slate-400 border border-slate-700 text-[11px] font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                <XCircle size={14}/> Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}