import React, { useState, useEffect } from 'react';
import { Cpu, Plus, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';

export default function ModelHub() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 弹窗控制
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 表单状态
  const [newModel, setNewModel] = useState({ id: '', name: '', provider: '', type: 'LLM', api_key: '' });
  const [saving, setSaving] = useState(false);
  // 判断是新增还是更新 (只读状态控制)
  const [isEditing, setIsEditing] = useState(false);

  const fetchModels = () => {
    setLoading(true);
    fetch('http://localhost:8000/api/models')
      .then(res => res.json())
      .then(data => { setModels(data.data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => { fetchModels(); }, []);

  // 💡 触发“新增”弹窗
  const handleOpenAdd = () => {
    setIsEditing(false);
    setNewModel({ id: '', name: '', provider: '', type: 'LLM', api_key: '' });
    setIsModalOpen(true);
  };

  // 💡 触发“更新 Key”弹窗
  const handleOpenEdit = (model: any) => {
    setIsEditing(true);
    setNewModel({ 
      id: model.id, 
      name: model.name, 
      provider: model.provider, 
      type: model.type, 
      api_key: '' // 故意留空，让用户填新的
    });
    setIsModalOpen(true);
  };

  // 提交到后端 (新增和更新是同一个覆盖写入逻辑)
  const handleSaveModel = async () => {
    setSaving(true);
    try {
      await fetch('http://localhost:8000/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newModel)
      });
      setIsModalOpen(false);
      fetchModels(); // 提交成功后重新拉取列表
    } catch (err) {
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-900 text-slate-200 relative w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Cpu className="text-blue-500" /> Model Hub</h1>
          <p className="text-xs text-slate-500 mt-1">管理系统底层的大脑 (支持无限动态接入与更新新模型)</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded flex items-center gap-2 transition-all shadow-[0_0_10px_rgba(37,99,235,0.4)]"
        >
          <Plus size={14} /> 新增模型接入
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Loader2 className="animate-spin" size={16} /> 正在读取资产库...
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
          {models.map((m) => (
            <div key={m.id} className="bg-slate-950 border border-slate-800 rounded-lg p-5 hover:border-blue-500/50 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-500 font-bold">
                  {m.provider.charAt(0)}
                </div>
                {m.status === 'active' ? (
                  <span className="flex items-center gap-1 text-[10px] text-green-500 bg-green-500/10 px-2 py-1 rounded"><CheckCircle2 size={12}/> Connected</span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] text-orange-500 bg-orange-500/10 px-2 py-1 rounded"><AlertCircle size={12}/> Missing Key</span>
                )}
              </div>
              <h3 className="font-bold text-sm mb-1">{m.name}</h3>
              <p className="text-[11px] text-slate-500 mb-2 tracking-wide uppercase">{m.provider} · {m.type}</p>
              
              <div className="text-[10px] font-mono text-slate-600 mb-4 bg-slate-900 px-2 py-1.5 rounded border border-slate-800/50 flex items-center">
                <span className="text-slate-500 w-10">Key:</span> 
                {m.api_key_masked ? <span className="text-slate-400">{m.api_key_masked}</span> : <span className="text-orange-500/70">未配置</span>}
              </div>

              <div className="flex gap-2 mt-auto">
                {/* 💡 绑定点击事件，打开弹窗并填入当前模型数据 */}
                <button 
                  onClick={() => handleOpenEdit(m)}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 hover:text-blue-400 border border-slate-800 text-[10px] py-1.5 rounded transition-colors text-slate-400"
                >
                  更新 Key
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 动态弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-[400px] shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-bold text-slate-200">{isEditing ? '更新模型 API Key' : '接入新模型'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-300"><X size={16}/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Model ID (请求调用名)</label>
                <input 
                  type="text" 
                  disabled={isEditing} // 更新时不允许改 ID
                  placeholder="如: deepseek-chat" 
                  value={newModel.id} 
                  onChange={e => setNewModel({...newModel, id: e.target.value})} 
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500 disabled:opacity-50" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">展示名称</label>
                <input type="text" disabled={isEditing} placeholder="如: DeepSeek V3" value={newModel.name} onChange={e => setNewModel({...newModel, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500 disabled:opacity-50" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">厂商</label>
                  <input type="text" disabled={isEditing} placeholder="如: DeepSeek" value={newModel.provider} onChange={e => setNewModel({...newModel, provider: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500 disabled:opacity-50" />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">类型</label>
                  <select disabled={isEditing} value={newModel.type} onChange={e => setNewModel({...newModel, type: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500 disabled:opacity-50">
                    <option>LLM</option>
                    <option>LLM & Vision</option>
                    <option>LLM (Reasoning)</option>
                    <option>Embedding</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1.5">API Key (必填)</label>
                <input 
                  type="password" 
                  placeholder={isEditing ? "请输入新的 API Key" : "sk-..."}
                  value={newModel.api_key} 
                  onChange={e => setNewModel({...newModel, api_key: e.target.value})} 
                  className="w-full bg-slate-950 border border-blue-500/50 rounded px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500 focus:shadow-[0_0_10px_rgba(37,99,235,0.2)]" 
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors">取消</button>
              <button 
                onClick={handleSaveModel} 
                disabled={saving || !newModel.id || !newModel.api_key} 
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold py-2 px-6 rounded transition-all flex items-center gap-2"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : '保存并连接'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}