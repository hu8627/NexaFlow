import React, { useState } from 'react';
import { CheckSquare, Plus, Activity, AlertTriangle, Target, CheckCircle2, TrendingUp } from 'lucide-react';

export default function EvaluatorsHub() {
  const [evals] = useState([
    {
      id: 'eval_code_quality', name: 'Python 架构规范审查器',
      target: 'Agent: Code Crafter', type: 'LLM-as-a-Judge',
      criteria: ['模块单向依赖', 'Type Hints 完整度 > 90%', '无硬编码密钥'],
      threshold: 85, passRate: '68%', avgScore: 82, status: 'active'
    },
    {
      id: 'eval_cs_tone', name: '售后安抚情绪打分',
      target: 'Flow: 智能客诉处理', type: 'Semantic Similarity',
      criteria: ['同理心表达', '未承认系统漏洞', '赔偿方案在 Rules 限额内'],
      threshold: 90, passRate: '94%', avgScore: 96, status: 'active'
    }
  ]);

  return (
    <div className="p-8 h-full overflow-y-auto bg-[#0B0F19] text-slate-200 w-full">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><CheckSquare className="text-indigo-500" /> Evaluators (Evals)</h1>
          <p className="text-xs text-slate-500 mt-1.5">Agent 不能自己给自己打分。在此配置独立的裁判模型与评分量表 (Rubrics)，在执行后进行自动化质检。</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 px-5 rounded-lg flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]">
          <Plus size={14} /> 部署新评估器
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {evals.map((e) => (
          <div key={e.id} className="bg-[#0E121B] border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/50 transition-all duration-300 shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-[15px] text-slate-100 flex items-center gap-2">{e.name}</h3>
                <div className="text-[10px] text-slate-500 font-mono mt-1 flex items-center gap-2">
                  <span className="bg-slate-900 border border-slate-700 px-2 py-0.5 rounded">{e.id}</span>
                  <span className="text-indigo-400 bg-indigo-900/20 px-2 py-0.5 rounded border border-indigo-500/30">{e.type}</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/30 px-2 py-1 rounded-full border border-emerald-900/50">
                <CheckCircle2 size={12}/> Active
              </span>
            </div>

            <div className="bg-[#050505] rounded-xl border border-slate-800/80 p-4 mb-5 shadow-inner">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Target size={12}/> Scoring Rubrics (评分标准)</div>
              <ul className="space-y-2">
                {e.criteria.map((c, idx) => (
                  <li key={idx} className="text-[11px] text-slate-300 flex items-start gap-2">
                    <span className="text-indigo-500 mt-0.5">•</span> {c}
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                <span className="text-slate-500">Pass Threshold (及格线): <span className="font-bold text-amber-400">{e.threshold} / 100</span></span>
                <span className="text-slate-500">Action on Fail: <span className="font-bold text-rose-400">Retry (Max 3) -{'>'}Ticket</span></span>
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Avg Score</div>
                <div className="text-lg font-black text-indigo-400 font-mono">{e.avgScore}</div>
              </div>
              <div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Pass Rate</div>
                <div className="text-lg font-black text-emerald-400 font-mono flex items-center gap-1.5">{e.passRate} <TrendingUp size={14} className="text-emerald-500/50"/></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}