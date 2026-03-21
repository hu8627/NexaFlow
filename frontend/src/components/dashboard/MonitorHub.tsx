import React, { useState, useEffect } from 'react';
import { ShieldAlert, Plus, Power, AlertTriangle, Eye, Settings, Loader2 } from 'lucide-react';

export default function MonitorHub() {
  const [monitors, setMonitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:8000/api/monitors')
      .then(res => res.json())
      .then(data => { setMonitors(data.data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  // 辅助渲染警报级别的颜色
  const getActionColor = (action: string) => {
    if (action.includes('Suspend')) return 'text-orange-400 bg-orange-900/30 border-orange-800/50';
    if (action.includes('Terminate')) return 'text-red-400 bg-red-900/30 border-red-800/50';
    if (action.includes('Confirm')) return 'text-blue-400 bg-blue-900/30 border-blue-800/50';
    return 'text-slate-400 bg-slate-800 border-slate-700';
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-900 text-slate-200 w-full relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldAlert className="text-red-500" /> Monitor & Guards</h1>
          <p className="text-xs text-slate-500 mt-1">定义全局熔断阈值与人工接管规则 (保障 AI 执行绝对安全)</p>
        </div>
        <button className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2 px-4 rounded flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)]">
          <Plus size={14} /> 新建熔断规则
        </button>
      </div>

      {/* 顶部全局统计状态 */}
      <div className="flex gap-4 mb-8">
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex-1 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Global Guardian Status</div>
            <div className="text-lg font-bold text-green-400 flex items-center gap-2">ACTIVE <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span></div>
          </div>
        </div>
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex-1 flex flex-col justify-center">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total Intercepts (Today)</div>
          <div className="text-2xl font-black text-orange-500">12 <span className="text-[10px] text-slate-500 font-normal ml-2">Times</span></div>
        </div>
      </div>

      {/* 规则卡片列表 */}
      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Loader2 className="animate-spin" size={16} /> 正在读取系统防护规则...
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">Active Rules (生效中的规则)</h2>
          
          {monitors.map((m) => (
            <div key={m.id} className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex items-center hover:border-slate-600 transition-colors group">
              
              {/* 规则名与作用域 */}
              <div className="w-1/4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${m.status === 'active' ? 'bg-green-500' : 'bg-slate-600'}`}></span>
                  <h3 className="font-bold text-sm text-slate-200">{m.name}</h3>
                </div>
                <div className="text-[10px] text-slate-500 font-mono ml-4">Target: {m.target}</div>
              </div>

              {/* 触发条件 */}
              <div className="flex-1 px-6 border-l border-slate-800">
                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Condition (触发条件)</div>
                <div className="text-xs font-mono text-orange-400 bg-orange-950/20 py-1.5 px-3 rounded inline-block border border-orange-900/50">
                  IF <span className="font-bold text-orange-300">{m.condition}</span>
                </div>
              </div>

              {/* 执行动作 (熔断/报警) */}
              <div className="w-1/4 px-6 border-l border-slate-800">
                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Action (拦截动作)</div>
                <div className={`text-[11px] font-bold py-1.5 px-3 rounded border w-max ${getActionColor(m.action)} flex items-center gap-1.5`}>
                  {m.action.includes('Suspend') ? <AlertTriangle size={12}/> : <Eye size={12}/>}
                  {m.action}
                </div>
              </div>

              {/* 开关与设置 */}
              <div className="w-24 flex items-center justify-end gap-3 text-slate-500">
                <button className="hover:text-blue-400 transition-colors"><Settings size={16}/></button>
                <button className={`p-1.5 rounded-full transition-colors ${m.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-slate-800 text-slate-400 hover:text-green-500'}`}>
                  <Power size={14}/>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}