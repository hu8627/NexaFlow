import React, { useState, useEffect } from 'react';
import { Network, Plus, Clock, PlayCircle, MoreVertical, Activity, Loader2, MessageSquare, Sparkles } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

export default function FlowList() {
  const { setActiveFlow, setCurrentView } = useUIStore();
  const [flows, setFlows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 💡 100% 真实向后端要数据
  useEffect(() => {
    fetch('http://localhost:8000/api/flows')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') setFlows(data.data);
        setLoading(false);
      })
      .catch(err => { console.error("读取资产列表失败", err); setLoading(false); });
  }, []);

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-900 text-slate-200 w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Network className="text-blue-500" /> Studio Workspace</h1>
          <p className="text-xs text-slate-500 mt-1">管理并编排你的 AI 数字员工业务流 (真实读取 FileDB)</p>
        </div>
        <button 
          onClick={() => setCurrentView('chat')} // 点击引导去 Chat 生成
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded flex items-center gap-2 transition-all"
        >
          <Plus size={14} /> 去 Copilot 动态生成
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Loader2 className="animate-spin" size={16} /> 正在扫描底层业务资产...
        </div>
      ) : flows.length === 0 ? (
        /* 空白状态引导 */
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-700/50 rounded-xl bg-slate-900/30">
          <MessageSquare size={32} className="text-slate-600 mb-4" />
          <h3 className="text-slate-400 font-bold mb-2">资产库空空如也</h3>
          <p className="text-xs text-slate-500 mb-4">当前没有任何沉淀的 JSON 业务流。</p>
          <button onClick={() => setCurrentView('chat')} className="text-blue-400 text-xs hover:underline flex items-center gap-1"><Sparkles size={12}/> 立刻去和 Copilot 对话生成一个吧！</button>
        </div>
      ) : (
        /* 真实渲染列表 */
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
          {flows.map((flow) => (
            <div 
              key={flow.id} 
              className="bg-slate-950 border border-slate-800 rounded-lg p-5 hover:border-blue-500/50 transition-all group relative flex flex-col cursor-pointer"
              onClick={() => setActiveFlow(flow.id)}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono">
                  {flow.id.substring(0, 15)}
                </span>
              </div>
              <h3 className="font-bold text-[15px] mb-2 text-slate-100 group-hover:text-blue-400 transition-colors">{flow.name}</h3>
              <p className="text-[11px] text-slate-500 mb-6 flex-1 leading-relaxed line-clamp-3">
                {flow.description || '无描述'}
              </p>
              <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/60 pt-4 mt-auto">
                {/* 💡 动态计算 JSON 里的节点数量 */}
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><Activity size={12}/> {flow.nodes?.length || 0} Nodes</span>
                </div>
              </div>
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <div className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                  <PlayCircle size={16} /> 载入真实画布
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}