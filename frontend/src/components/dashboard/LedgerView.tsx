import React, { useState, useEffect } from 'react';
import { Database, Search, Filter, AlertTriangle, CheckCircle2, Clock, Eye, MessageSquare, PlayCircle, Loader2, Sparkles, Network } from 'lucide-react';

export default function LedgerView() {
  const [activeTab, setActiveTab] = useState<'traces' | 'interventions'>('traces');
  
  // 💡 动态状态
  const [traces, setTraces] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // 并发请求后端的两个运行时表
    Promise.all([
      fetch('http://localhost:8000/api/traces').then(res => res.json()),
      fetch('http://localhost:8000/api/cases').then(res => res.json())
    ]).then(([tracesData, casesData]) => {
      if (tracesData.status === 'success') setTraces(tracesData.data);
      if (casesData.status === 'success') setCases(casesData.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-900 text-slate-200 w-full relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Database className="text-purple-500" /> Ledger & Monitor</h1>
          <p className="text-xs text-slate-500 mt-1">全局执行轨迹追踪与人工介入修正账本 (真实读取底层 Runtime DB)</p>
        </div>
      </div>

      <div className="flex border-b border-slate-800 mb-6">
        <button 
          onClick={() => setActiveTab('traces')}
          className={`pb-3 px-4 text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'traces' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          执行轨迹追踪 ({traces.length})
        </button>
        <button 
          onClick={() => setActiveTab('interventions')}
          className={`pb-3 px-4 text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'interventions' ? 'border-b-2 border-orange-500 text-orange-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <AlertTriangle size={14}/> 人工修正账本 ({cases.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Loader2 className="animate-spin" size={16} /> 正在调阅底层运行账本...
        </div>
      ) : (
        <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
          
          <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 w-64">
              <Search size={14} className="text-slate-500" />
              <input type="text" placeholder="Search ID..." className="bg-transparent border-none outline-none text-xs w-full text-slate-200 placeholder-slate-600" />
            </div>
          </div>

          {/* 视窗 A：执行轨迹 */}
          {activeTab === 'traces' && (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/80 text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3 font-bold">Trace ID & Time</th>
                  <th className="px-6 py-3 font-bold">Trigger Intent (Chat)</th>
                  <th className="px-6 py-3 font-bold">Matched Flow (SOP)</th>
                  <th className="px-6 py-3 font-bold">Status</th>
                  <th className="px-6 py-3 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {traces.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-blue-400 text-xs">{t.id}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-1"><Clock size={10}/> {t.time} ({t.duration})</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-300 flex items-center gap-2"><MessageSquare size={12} className="text-slate-600"/> "{t.intent}"</div>
                      <div className="text-[9px] text-slate-500 mt-1">by {t.user}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-1 rounded text-[10px] flex items-center gap-1 w-max">
                        <Network size={10}/> {t.flow_id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {t.status === 'success' && <span className="text-[10px] text-green-500 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded flex items-center gap-1 w-max"><CheckCircle2 size={12}/> Success</span>}
                      {t.status === 'suspended' && <span className="text-[10px] text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-1 rounded flex items-center gap-1 w-max animate-pulse"><AlertTriangle size={12}/> Suspended</span>}
                      {t.status === 'error' && <span className="text-[10px] text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded flex items-center gap-1 w-max">Failed</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-500 hover:text-blue-400 text-[10px] font-bold flex items-center gap-1 ml-auto">
                        <PlayCircle size={14}/> Replay
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 视窗 B：人工修正账本 (AI 进化的燃料) */}
          {activeTab === 'interventions' && (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/80 text-[10px] uppercase tracking-wider text-orange-500/70 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3 font-bold">Case ID</th>
                  <th className="px-6 py-3 font-bold">Failed Node & Reason</th>
                  <th className="px-6 py-3 font-bold">Human Action (The Fix)</th>
                  <th className="px-6 py-3 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {cases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-orange-400 text-xs">{c.id}</div>
                      <div className="text-[10px] text-slate-500 mt-1">{c.time}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-slate-300">{c.node_id}</div>
                      <div className="text-[10px] text-red-400/80 mt-1 border-l-2 border-red-500/50 pl-2">AI Suspended: "{c.reason}"</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-[10px] text-green-400 bg-green-900/20 border border-green-800/50 p-2 rounded">
                        {'> '} {c.human_action}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right flex flex-col items-end gap-2">
                      <button className="text-blue-500 hover:text-blue-400 text-[10px] font-bold flex items-center gap-1">
                        <Eye size={14}/> View Snapshot
                      </button>
                      <button 
                        onClick={() => {
                          alert(`🚀 正在唤醒 Optimizer Agent...\n即将根据此记录 (${c.reason}) 自动重写底层 ${c.flow_id} 流程图！`);
                          fetch('http://localhost:8000/api/optimize_flow', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ flow_id: c.flow_id, case_reason: c.reason, human_action: c.human_action })
                          })
                          .then(res => res.json())
                          .then(data => alert(data.msg));
                        }}
                        className="bg-orange-500/20 hover:bg-orange-500/40 border border-orange-500/50 text-orange-400 text-[10px] font-bold py-1 px-2 rounded transition-colors flex items-center gap-1"
                      >
                        <Sparkles size={12}/> Auto Optimize SOP
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

        </div>
      )}
    </div>
  );
}