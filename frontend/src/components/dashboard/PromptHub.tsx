import React, { useState, useEffect } from 'react';
import { Quote, Plus, Loader2, X, Tags, Copy, History, TerminalSquare } from 'lucide-react';

export default function PromptHub() {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newPrompt, setNewPrompt] = useState({ id: '', name: '', desc: '', content: '', tags: '', version: '1.0' });

  const fetchPrompts = () => {
    setLoading(true);
    fetch('http://localhost:8000/api/prompts')
      .then(res => res.json())
      .then(data => { setPrompts(data.data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => { fetchPrompts(); }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setNewPrompt({ id: '', name: '', desc: '', content: '', tags: '', version: '1.0' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: any) => {
    setIsEditing(true);
    setNewPrompt({ ...p, tags: Array.isArray(p.tags) ? p.tags.join(', ') : p.tags });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...newPrompt,
        id: newPrompt.id || `prompt_${Date.now()}`,
        tags: typeof newPrompt.tags === 'string' ? newPrompt.tags.split(',').map((t: string) => t.trim()) : newPrompt.tags
      };
      await fetch('http://localhost:8000/api/prompts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      setIsModalOpen(false);
      fetchPrompts();
    } catch (err) { alert("保存失败"); } 
    finally { setSaving(false); }
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950 text-slate-200 relative w-full">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Quote className="text-amber-500" /> Prompts Engineering</h1>
          <p className="text-xs text-slate-500 mt-1.5">管理企业的核心智力资产。将经过反复打磨的 Prompt 沉淀为标准模板，供 Agents 挂载调用。</p>
        </div>
        <button onClick={handleOpenAdd} className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold py-2.5 px-5 rounded-lg flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]">
          <Plus size={14} /> 沉淀新 Prompt
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 gap-3 text-slate-500 text-sm">
          <Loader2 className="animate-spin" size={18} /> 正在调阅提示词金库...
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
          {prompts.map((p) => (
            <div key={p.id} className="bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col relative group transition-all duration-300 hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.05)] overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/20 group-hover:bg-amber-500 transition-colors"></div>
              
              <div className="p-6 flex flex-col h-full pl-8">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                    {p.name}
                  </h3>
                  <span className="flex items-center gap-1 text-[10px] text-amber-500/70 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    <History size={10}/> v{p.version}
                  </span>
                </div>
                
                <p className="text-[11px] text-slate-500 mb-4 h-8">{p.desc}</p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {p.tags?.map((t: string, i: number) => (
                    <span key={i} className="flex items-center gap-1 text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 uppercase tracking-wider">
                      <Tags size={8}/> {t}
                    </span>
                  ))}
                </div>
                
                <div className="bg-[#0a0a0a] rounded-lg border border-slate-800/80 mb-6 flex-1 flex flex-col overflow-hidden relative group/code">
                  <div className="bg-slate-900/80 px-3 py-1.5 border-b border-slate-800 flex justify-between items-center">
                    <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1.5"><TerminalSquare size={10}/> payload.txt</span>
                    <button className="text-slate-500 hover:text-slate-300 opacity-0 group-hover/code:opacity-100 transition-opacity"><Copy size={12}/></button>
                  </div>
                  <div className="p-3 text-[10px] font-mono text-slate-400 leading-relaxed overflow-y-auto max-h-32 custom-scrollbar whitespace-pre-wrap">
                    {p.content.split(/({.*?})/).map((part: string, i: number) => 
                      part.startsWith('{') && part.endsWith('}') 
                        ? <span key={i} className="text-amber-400 bg-amber-400/10 px-1 rounded">{part}</span> 
                        : <span key={i}>{part}</span>
                    )}
                  </div>
                </div>

                <div className="mt-auto">
                  <button onClick={() => handleOpenEdit(p)} className="w-full bg-slate-800/50 hover:bg-slate-700 border border-slate-700/50 text-[11px] font-bold py-2 rounded-lg transition-colors text-slate-300">
                    深度调优 (Tune)
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 编辑弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-slate-800/30 px-6 py-4 border-b border-slate-800/80 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2"><Quote size={16} className="text-amber-500"/> {isEditing ? '调优 Prompt' : '沉淀新 Prompt'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-300 bg-slate-800/50 hover:bg-slate-700 p-1.5 rounded-md"><X size={16}/></button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">模板名称</label>
                  <input type="text" value={newPrompt.name} onChange={e => setNewPrompt({...newPrompt, name: e.target.value})} className="w-full bg-[#0a0a0a] border border-slate-700 rounded-lg px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-amber-500" />
                </div>
                <div className="w-32">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">版本号</label>
                  <input type="text" value={newPrompt.version} onChange={e => setNewPrompt({...newPrompt, version: e.target.value})} className="w-full bg-[#0a0a0a] border border-slate-700 rounded-lg px-4 py-2.5 text-xs text-slate-200 font-mono outline-none focus:border-amber-500" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">用途描述</label>
                <input type="text" value={newPrompt.desc} onChange={e => setNewPrompt({...newPrompt, desc: e.target.value})} className="w-full bg-[#0a0a0a] border border-slate-700 rounded-lg px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">分类标签 (逗号分隔)</label>
                <input type="text" value={newPrompt.tags} onChange={e => setNewPrompt({...newPrompt, tags: e.target.value})} placeholder="如: System, Routing" className="w-full bg-[#0a0a0a] border border-slate-700 rounded-lg px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-amber-500" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-bold text-amber-500 uppercase tracking-wider">Prompt 正文 (System Instructions)</label>
                  <span className="text-[9px] text-slate-500">使用 {"{变量名}"} 插入动态上下文</span>
                </div>
                <textarea rows={8} value={newPrompt.content} onChange={e => setNewPrompt({...newPrompt, content: e.target.value})} className="w-full bg-[#0a0a0a] border border-amber-500/50 rounded-lg p-4 text-xs text-slate-200 font-mono outline-none focus:border-amber-500 focus:shadow-[0_0_15px_rgba(245,158,11,0.15)] transition-all resize-none leading-relaxed" />
              </div>
            </div>

            <div className="bg-slate-800/20 px-6 py-4 border-t border-slate-800/80 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200">取消</button>
              <button onClick={handleSave} disabled={saving || !newPrompt.name || !newPrompt.content} className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold py-2 px-6 rounded-lg transition-all flex items-center gap-2 shadow-lg">
                {saving ? <Loader2 size={14} className="animate-spin" /> : '保存至金库'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}