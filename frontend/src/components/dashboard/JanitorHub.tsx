import React, { useState } from 'react';
import { Wand2, AlertTriangle, Trash2, GitMerge, FileWarning, Search, Zap } from 'lucide-react';

export default function JanitorHub() {
  const [tasks] = useState([
    {
      id: 'task_clean_01', type: 'Dead Flow', target: 'flow_marketing_v1',
      issue: '该流程图纸已连续 90 天未被触发，且被 flow_marketing_v2 完全替代。',
      action: 'Archive & Delete', severity: 'low'
    },
    {
      id: 'task_conflict_02', type: 'Rule Conflict', target: 'Rule: Refund Policy',
      issue: '法务部昨日更新了 [退款上限 100元]，但在 Studio 的 [N3_售后节点] 中硬编码了 [max_amount: 500]。存在严重的合规执行冲突！',
      action: 'Auto-Rewrite Node Params', severity: 'high'
    }
  ]);

  return (
    <div className="p-8 h-full overflow-y-auto bg-[#0B0F19] text-slate-200 w-full">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Wand2 className="text-purple-500" /> Janitor (Anti-Entropy)</h1>
          <p className="text-xs text-slate-500 mt-1.5">Build to Delete (为删除而构建)。系统清理者定期扫描冗余图纸与法则冲突，对抗系统熵增与腐化。</p>
        </div>
        <button className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2.5 px-5 rounded-lg flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]">
          <Zap size={14} /> 立即执行全盘扫描
        </button>
      </div>

      <div className="space-y-4">
        {tasks.map((t) => (
          <div key={t.id} className="bg-[#0E121B] border border-slate-800 rounded-xl p-5 flex items-start gap-5 hover:border-purple-500/30 transition-colors group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${t.severity === 'high' ? 'bg-rose-900/20 border-rose-500/30 text-rose-500' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
              {t.severity === 'high' ? <AlertTriangle size={20}/> : <FileWarning size={20}/>}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${t.severity === 'high' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>{t.type}</span>
                <h3 className="font-bold text-sm text-slate-200">{t.target}</h3>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">{t.issue}</p>
              <button className="text-[11px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5">
                <Wand2 size={12}/> {t.action}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}