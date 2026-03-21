import React, { useState, useEffect } from 'react';
import { Users, Plus, BrainCircuit, Wrench, Settings2, Activity, PlayCircle, Bot, Loader2, Power, Cpu, X } from 'lucide-react';

export default function AgentHub() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 控制新增/编辑弹窗
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAgent, setNewAgent] = useState({ id: '', name: '', role: '', desc: '', model: 'gpt-4o', skills: ['browser_use'], isSystem: false, status: 'active' });
  const [saving, setSaving] = useState(false);

  // 💡 1. 从后端 FileDB 真实拉取 Agents 资产
  const fetchAgents = () => {
    setLoading(true);
    fetch('http://localhost:8000/api/agents')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') setAgents(data.data);
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => { fetchAgents(); }, []);

  // 💡 2. 提交新员工到后端 FileDB
  const handleSaveAgent = async () => {
    setSaving(true);
    try {
      const agentToSave = {
        ...newAgent,
        id: newAgent.id || `agent_custom_${Date.now()}`,
        // 简单处理，将逗号分隔的字符串转为数组
        skills: typeof newAgent.skills === 'string' ? (newAgent.skills as string).split(',').map(s => s.trim()) : newAgent.skills
      };
      
      await fetch('http://localhost:8000/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentToSave)
      });
      setIsModalOpen(false);
      fetchAgents(); // 刷新列表
    } catch (err) {
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-900 text-slate-200 w-full relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="text-emerald-500" /> Agents Hub</h1>
          <p className="text-xs text-slate-500 mt-1">组建并管理你的数字员工团队 (配置大模型、赋予人设、挂载专属 Skills，实时落盘至 FileDB)</p>
        </div>
        <button 
          onClick={() => {
            setNewAgent({ id: '', name: '', role: 'Executor', desc: '', model: 'gpt-4o', skills: ['browser_use'], isSystem: false, status: 'active' });
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-4 rounded flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
        >
          <Plus size={14} /> 创建数字员工
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Loader2 className="animate-spin" size={16} /> 正在扫描底层数字员工资产库...
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div key={agent.id} className={`bg-slate-950 border ${agent.isSystem ? 'border-blue-500/30' : 'border-slate-800'} rounded-lg flex flex-col hover:border-emerald-500/50 transition-colors group overflow-hidden`}>
              
              <div className={`p-4 border-b ${agent.isSystem ? 'bg-blue-950/20 border-blue-900/30' : 'bg-slate-900/50 border-slate-800'} flex items-start gap-4`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${agent.isSystem ? 'bg-blue-900/40 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-slate-800 border-slate-700 text-emerald-400'}`}>
                  {agent.isSystem ? <BrainCircuit size={24} /> : <Bot size={24} />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-[15px] text-slate-100">{agent.name}</h3>
                    {agent.status === 'active' && <span className="flex items-center gap-1.5 text-[9px] text-emerald-500 font-bold uppercase"><Activity size={10} className="animate-pulse"/> Active</span>}
                    {agent.status === 'idle' && <span className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold uppercase"><Power size={10}/> Idle</span>}
                  </div>
                  <div className={`text-[10px] font-mono px-2 py-0.5 rounded border inline-block ${agent.isSystem ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                    {agent.role}
                  </div>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <p className="text-[11px] text-slate-400 mb-4 flex-1">{agent.desc}</p>
                
                <div className="space-y-3">
                  <div className="bg-slate-900 rounded p-2 border border-slate-800/50">
                    <div className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1.5 mb-1.5"><Cpu size={12}/> Assigned Model</div>
                    <div className="text-xs font-mono text-blue-300">{agent.model}</div>
                  </div>
                  
                  <div className="bg-slate-900 rounded p-2 border border-slate-800/50">
                    <div className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1.5 mb-1.5"><Wrench size={12}/> Mounted Skills</div>
                    <div className="flex flex-wrap gap-1.5">
                      {agent.skills.map((skill: string, idx: number) => (
                        <span key={idx} className="bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-400">{skill}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 py-1.5 rounded transition-colors">
                  <Settings2 size={14}/> 调整人设 (Prompt)
                </button>
                {!agent.isSystem && (
                  <button className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/20 hover:bg-emerald-900/40 border border-emerald-900/50 py-1.5 rounded transition-colors">
                    <PlayCircle size={14}/> 独立唤醒调试
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* 💡 弹窗表单：用于创建新的 Agent 写入 FileDB */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-[450px] shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2"><Bot size={18} className="text-emerald-500"/> 创建新数字员工</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-300"><X size={16}/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">员工名称 (如: 高级售后专员)</label>
                <input type="text" placeholder="输入名称..." value={newAgent.name} onChange={e => setNewAgent({...newAgent, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">系统定位 (Role)</label>
                  <input type="text" placeholder="如: Executor" value={newAgent.role} onChange={e => setNewAgent({...newAgent, role: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500" />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">挂载大模型</label>
                  <input type="text" placeholder="如: gpt-4o" value={newAgent.model} onChange={e => setNewAgent({...newAgent, model: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">人设指令与职责描述</label>
                <textarea rows={3} placeholder="描述该员工的核心工作职责和约束..." value={newAgent.desc} onChange={e => setNewAgent({...newAgent, desc: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">挂载 Skills (逗号分隔)</label>
                <input type="text" placeholder="如: browser_use, sql_query" value={newAgent.skills as any} onChange={e => setNewAgent({...newAgent, skills: e.target.value as any})} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500" />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors">取消</button>
              <button onClick={handleSaveAgent} disabled={saving || !newAgent.name} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold py-2 px-6 rounded transition-all flex items-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : '确认雇佣并入库'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}