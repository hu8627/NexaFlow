import React, { useState, useEffect } from 'react';
import { Archive, Plus, Database, Server, RefreshCw, FolderGit2, Loader2, Code2, PlayCircle, X, TerminalSquare } from 'lucide-react';

export default function AssetHub() {
  const [activeTab, setActiveTab] = useState<'system' | 'business'>('system');
  const [metaAssets, setMetaAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 💡 新增：数据探查器 (Data Explorer) 的状态控制
  const [exploringDomain, setExploringDomain] = useState<string | null>(null);
  const [domainData, setDomainData] = useState<any[] | null>(null);
  const [explorerLoading, setExplorerLoading] = useState(false);

  const [externalAssets] = useState([
    {
      id: 'ext_pg_001', name: '核心业务 CRM 库 (PostgreSQL)', category: 'Business Data', type: 'External RDBMS',
      records: '1.2M', size: '4.5 GB', last_updated: 'Live Sync', is_system: false,
      desc: '包含客户、订单、合同数据。可通过 [SQL_Query_Skill] 挂载给 Agent 实时查询。',
      icon: <Database size={20} className="text-blue-400" />, color: 'border-blue-500/30 bg-blue-900/10'
    },
    {
      id: 'ext_vec_002', name: '售后退款规则库 (Milvus)', category: 'Knowledge Base', type: 'Vector DB (RAG)',
      records: '14,500', size: '250 MB', last_updated: '2 hours ago', is_system: false,
      desc: '内含数十万条历史工单及标准话术向量，用于 RAG 节点自动召回最优回复。',
      icon: <Server size={20} className="text-purple-400" />, color: 'border-purple-500/30 bg-purple-900/10'
    }
  ]);

  useEffect(() => {
    fetch('http://localhost:8000/api/assets/meta')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') setMetaAssets(data.data);
        setLoading(false);
      })
      .catch(err => { console.error("加载系统资产失败", err); setLoading(false); });
  }, []);

  // 💡 核心新增：点击卡片时，去后端拉取该表的真实数据
  const handleExplore = (domain: string) => {
    setExploringDomain(domain);
    setExplorerLoading(true);
    setDomainData(null);

    // 调用我们在 main.py 里写好的各个域的读取接口
    // 如果是通用接口，可以直接请求对应的 endpoints
    fetch(`http://localhost:8000/api/${domain}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setDomainData(data.data);
        } else {
          setDomainData([{ error: "无法读取该表数据", msg: data.msg }]);
        }
        setExplorerLoading(false);
      })
      .catch(err => {
        setDomainData([{ error: "网络请求失败", details: err.toString() }]);
        setExplorerLoading(false);
      });
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-950 text-slate-200 w-full relative">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Archive className="text-indigo-500" /> Data Assets & Meta</h1>
          <p className="text-xs text-slate-500 mt-1">管理外挂业务数据库，以及 NexaFlow OS 自身的底层元数据 (Self-Hosted Data)</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold py-2 px-4 rounded flex items-center gap-2 transition-all shadow-md">
            <Database size={14} /> 接入外部数据库
          </button>
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 px-4 rounded flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <Plus size={14} /> 新建知识库 (RAG)
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800/80 mb-8">
        <button onClick={() => setActiveTab('system')} className={`pb-3 px-4 text-xs font-bold transition-all flex items-center gap-2 relative ${activeTab === 'system' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>
          <Code2 size={14}/> System Meta-Data
          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono ${activeTab === 'system' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>{loading ? '-' : metaAssets.length}</span>
          {activeTab === 'system' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-500 rounded-t-full shadow-[0_-2px_10px_rgba(99,102,241,0.5)]"></div>}
        </button>

        <button onClick={() => setActiveTab('business')} className={`pb-3 px-4 text-xs font-bold transition-all flex items-center gap-2 relative ${activeTab === 'business' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>
          <Database size={14}/> External Business Data
          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono ${activeTab === 'business' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>{externalAssets.length}</span>
          {activeTab === 'business' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 rounded-t-full shadow-[0_-2px_10px_rgba(59,130,246,0.5)]"></div>}
        </button>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm mb-8">
          <Loader2 className="animate-spin" size={16} /> 正在扫描底层 SQLite 系统资产...
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          
          {/* System Meta-Data */}
          {activeTab === 'system' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
              {metaAssets.map((asset) => (
                <div 
                  key={asset.id} 
                  onClick={() => handleExplore(asset.domain)} // 💡 绑定点击事件！
                  className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col hover:border-indigo-500/50 transition-colors group cursor-pointer shadow-sm hover:shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-700/80 text-slate-400 shadow-inner">
                        <FolderGit2 size={16} />
                      </div>
                      <div>
                        <h3 className="font-bold text-[13px] text-slate-200 group-hover:text-indigo-400 transition-colors">{asset.name}</h3>
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">{asset.type}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[#0a0a0a] rounded p-2 border border-slate-800/80 mb-3 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-500">表域 (Domain):</span>
                    <span className="text-indigo-400">{asset.domain}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/60 pt-3 mt-auto">
                    <span className="flex items-center gap-1"><Database size={10}/> {asset.records} Records</span>
                    <span className="flex items-center gap-1">{asset.size}</span>
                    <button className="text-indigo-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                       <PlayCircle size={12}/> Explore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* External Business Data */}
          {activeTab === 'business' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
              {externalAssets.map((asset) => (
                <div key={asset.id} className={`bg-slate-950 border ${asset.color} rounded-xl p-5 flex flex-col hover:border-slate-500/80 transition-all duration-300 group hover:-translate-y-0.5 shadow-md`}>
                  {/* ... 外部数据的渲染逻辑保持不变 ... */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-800/80 shadow-inner">{asset.icon}</div>
                      <div>
                        <h3 className="font-bold text-[15px] text-slate-100 group-hover:text-blue-400 transition-colors">{asset.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded uppercase tracking-wider">{asset.category}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{asset.type}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-6 flex-1 leading-relaxed border-l-2 border-slate-800 pl-3">{asset.desc}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/60 pt-4 mt-auto">
                    <div className="flex items-center gap-4">
                      <span className="font-mono bg-[#0a0a0a] px-2 py-1 rounded border border-slate-800/50 flex items-center gap-1.5"><Database size={10} className="text-slate-400"/> {asset.records} Records</span>
                    </div>
                    <button className="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded font-bold flex items-center gap-1.5">
                      <Database size={12}/> 编辑连接
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================= */}
      {/* 🌟 核心新增：Data Explorer (极客风 JSON 查看器弹窗) */}
      {/* ======================================================= */}
      {exploringDomain && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-[#0E121B] border border-slate-700/80 rounded-2xl w-full max-w-5xl h-[80vh] shadow-2xl flex flex-col overflow-hidden">
            
            {/* 弹窗 Header */}
            <div className="bg-[#0B0F19] px-6 py-4 border-b border-slate-800/80 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/50 text-indigo-400 flex items-center justify-center">
                  <TerminalSquare size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">Data Explorer</h2>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">SELECT * FROM sqlite_master.{exploringDomain}</p>
                </div>
              </div>
              <button 
                onClick={() => setExploringDomain(null)} 
                className="text-slate-500 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-700 p-1.5 rounded-md transition-colors"
              >
                <X size={16}/>
              </button>
            </div>
            
            {/* 弹窗 Body: JSON 渲染器 */}
            <div className="flex-1 bg-[#050505] p-6 overflow-y-auto custom-scrollbar relative">
              {explorerLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-indigo-500/50">
                  <Loader2 size={32} className="animate-spin mb-4" />
                  <span className="text-xs font-mono">Querying Local SQLite...</span>
                </div>
              ) : (
                <pre className="text-[11px] font-mono text-slate-300 leading-relaxed">
                  {/* 使用 JSON.stringify 进行格式化输出，极具极客感 */}
                  <code dangerouslySetInnerHTML={{
                    __html: JSON.stringify(domainData, null, 2)
                      .replace(/"(.*?)":/g, '<span class="text-indigo-400">"$1"</span>:') // 高亮 Key
                      .replace(/:\s"(.*?)"/g, ': <span class="text-emerald-400">"$1"</span>') // 高亮 String Value
                      .replace(/:\s(\d+)/g, ': <span class="text-amber-400">$1</span>') // 高亮 Number Value
                      .replace(/:\s(true|false)/g, ': <span class="text-rose-400">$1</span>') // 高亮 Boolean Value
                  }}></code>
                </pre>
              )}
            </div>

            {/* 弹窗 Footer */}
            <div className="bg-[#0B0F19] px-6 py-3 border-t border-slate-800/80 flex justify-between items-center shrink-0">
              <span className="text-[10px] text-slate-500 font-mono">
                {domainData ? `${domainData.length} records retrieved` : '0 records'}
              </span>
              <button 
                onClick={() => setExploringDomain(null)} 
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-1.5 px-4 rounded transition-colors"
              >
                Close Explorer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}