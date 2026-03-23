'use client';
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { 
  ReactFlow, Background, BackgroundVariant, Controls, MiniMap, 
  useNodesState, useEdgesState, addEdge, Connection, Edge 
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Loader2, PlayCircle, Edit3, Save, CheckCircle2, DownloadCloud, UploadCloud, AlertTriangle, Settings2, Network, Sparkles, TerminalSquare, Maximize2, Minimize2, ChevronDown } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useExecStore } from '@/store/execStore';

import BizNode from './BizNode';
import PhaseNode from './PhaseNode';
import SublaneNode from './SublaneNode';

const SUBLANE_WIDTH = 320;
const PHASE_HEADER_H = 46;

const nodeTypes = {
  bizNode: BizNode,
  phaseNode: PhaseNode,
  sublaneNode: SublaneNode,
};

export default function FlowCanvas() {
  const { activeFlowId } = useUIStore(); 
  const { logs } = useExecStore(); 
  const logEndRef = useRef<HTMLDivElement>(null);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [editMode, setEditMode] = useState(false);
  const [flowMeta, setFlowMeta] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 💡 新增：控制底部监控台的展开与折叠状态
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(true);

  useEffect(() => {
    if (!activeFlowId) { setLoading(false); return; }
    setLoading(true); setError(null);
    fetch(`http://localhost:8000/api/flows/${activeFlowId}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data) {
          setFlowMeta(data.data);
          setNodes(data.data.nodes || []);
          setEdges(data.data.edges || []);
        } else {
          setError(data.msg || "无法解析底层 JSON 文件");
          setNodes([]); setEdges([]);
        }
        setLoading(false);
      })
      .catch(err => { setError("网络请求失败"); setLoading(false); });
  }, [activeFlowId, setNodes, setEdges]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onNodeClick = (event: React.MouseEvent, node: any) => {
    if (!editMode) return;
    setSelectedNode(node);
    if (node.id.includes('CRM') || node.data?.interrupt_before) {
      setInsights({
        targetNode: node.id, failCount: 14,
        reason: '人类接管记录显示，AI 多次无法找到 "Save" 按钮。经分析 DOM 快照，系统存在偶发性网络延迟。',
        suggestion: '建议在组件配置中增加 [Wait_For_Selector] 参数，或增加 [重试机制 (Max Retries: 3)]。',
        autoFixData: { max_retries: 3, components: [{ type: 'action', tool_name: 'crm_api_submit', params: { wait_timeout: 5000, retry: true } }] }
      });
    } else setInsights(null);
  };

  const updateNodeData = (nodeId: string, newData: any) => {
    setNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n));
    setSelectedNode((prev: any) => ({ ...prev, data: { ...prev.data, ...newData } }));
  };

  const handleAutoFix = () => {
    if (!selectedNode || !insights) return;
    updateNodeData(selectedNode.id, insights.autoFixData);
    alert('✨ AI 建议已采纳！底层 JSON 配置已自动重写。');
    setInsights(null);
  };

  const onUpdateLabel = useCallback((nodeId: string, newLabel: string) => {
    setNodes((nds) => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, label: newLabel } } : n));
  }, [setNodes]);

  const onAddSublane = useCallback((phaseId: string) => {
    setNodes((nds) => {
      const existingLanes = nds.filter(n => n.parentNode === phaseId);
      const newLaneIndex = existingLanes.length;
      const newLaneId = `Lane_auto_${Date.now()}`;
      const newLane = {
        id: newLaneId, type: 'sublaneNode', parentNode: phaseId,
        position: { x: newLaneIndex * SUBLANE_WIDTH, y: PHASE_HEADER_H },
        style: { width: SUBLANE_WIDTH, height: 754, zIndex: 0 },
        data: { label: '未命名泳道' }, draggable: false, selectable: false
      };
      const newPhaseWidth = (newLaneIndex + 1) * SUBLANE_WIDTH;
      return nds.map(n => n.id === phaseId ? { ...n, style: { ...n.style, width: newPhaseWidth }, data: { ...n.data, stats: `${newLaneIndex + 1} 子泳道` } } : n).concat(newLane);
    });
  }, [setNodes]);

  const onDeleteSublane = useCallback((sublaneId: string) => setNodes(nds => nds.filter(n => n.id !== sublaneId)), [setNodes]);
  const onDeletePhase = useCallback((phaseId: string) => setNodes(nds => nds.filter(n => n.id !== phaseId && n.parentNode !== phaseId)), [setNodes]);

  const handleSaveFlow = async () => {
    if (!flowMeta) return;
    setSaving(true);
    const updatedFlow = { ...flowMeta, nodes, edges };
    try {
      const res = await fetch('http://localhost:8000/api/flows', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedFlow)
      });
      const result = await res.json();
      if (result.status === 'success') {
        setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 2000);
      } else alert(result.msg);
    } catch (err) { alert("网络请求失败，保存中止。"); } 
    finally { setSaving(false); }
  };

  const handleExport = () => {
    if (!flowMeta) return;
    const exportData = { ...flowMeta, nodes, edges };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${flowMeta.id || 'export'}.bpnl`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        setNodes(importedData.nodes || []); setEdges(importedData.edges || []);
        setFlowMeta({ ...flowMeta, ...importedData, id: activeFlowId });
        alert("✅ 流程图纸解析成功！请点击【保存流程资产】固化到您的本地数据库。");
      } catch (err) { alert("❌ 文件格式错误，无法解析 BPNL 协议。"); }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const nodeTypesMerged = useMemo(() => ({ bizNode: BizNode, phaseNode: PhaseNode, sublaneNode: SublaneNode }), []);
  const nodesWithProps = useMemo(() => {
    return nodes.map(n => ({
      ...n, data: { ...n.data, editMode, onAddSublane, onDeletePhase, onDeleteSublane, onUpdateLabel }
    }));
  }, [nodes, editMode, onAddSublane, onDeletePhase, onDeleteSublane, onUpdateLabel]);

  // 💡 模式切换逻辑：进入编排模式时自动收起底部监控台，进入监控模式时自动展开
  const toggleMode = (isEdit: boolean) => {
    setEditMode(isEdit);
    if (isEdit) {
      setSelectedNode(null);
      setIsBottomPanelOpen(false); // 编排时收起底部，留出最大画布空间
    } else {
      setIsBottomPanelOpen(true);  // 监控时展开底部，查看日志
    }
  };

  if (loading) return <div className="w-full h-full flex items-center justify-center text-slate-500 bg-[#050505]"><Loader2 className="animate-spin mb-4" size={32} /></div>;
  if (error) return <div className="w-full h-full flex flex-col items-center justify-center text-red-500 bg-[#050505]"><AlertTriangle className="mb-4" size={32} /> {error}</div>;

  return (
    <div className="w-full h-full flex bg-[#050505] relative overflow-hidden">
      
      {/* ========================================================= */}
      {/* 🚀 主体左侧：画板 + 底部监控台 (The Canvas Area) */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col relative min-w-0">
        
        {/* 顶部悬浮控制条 */}
        <div className="absolute top-4 left-4 z-10 flex gap-2 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-lg border border-slate-700/50 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
          <button 
            onClick={() => toggleMode(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded transition-colors ${!editMode ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
          >
            <PlayCircle size={14}/> 运行监控模式
          </button>
          <button 
            onClick={() => toggleMode(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded transition-colors ${editMode ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.4)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
          >
            <Edit3 size={14}/> 深度编排模式
          </button>
          
          {editMode && (
            <>
              <div className="w-px h-6 bg-slate-700 mx-1 my-auto"></div>
              <input type="file" accept=".json,.bpnl" ref={fileInputRef} onChange={handleImport} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors" title="导入 BPNL">
                <UploadCloud size={14}/> 导入
              </button>
              <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors" title="导出 BPNL">
                <DownloadCloud size={14}/> 导出
              </button>
              <button 
                onClick={handleSaveFlow} disabled={saving}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-bold rounded-md ml-2 transition-all duration-300 ${saveSuccess ? 'bg-emerald-600 text-white border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'text-emerald-400 hover:text-emerald-300 bg-emerald-950/30 border border-emerald-900/50'} ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {saving ? <Loader2 size={14} className="animate-spin"/> : (saveSuccess ? <CheckCircle2 size={14}/> : <Save size={14}/>)}
                {saving ? '固化中...' : (saveSuccess ? '资产已落盘' : '保存流程资产')}
              </button>
            </>
          )}
        </div>

        {/* 🗺️ 上方：React Flow 无限画布 */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodesWithProps} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={onNodeClick}
            nodeTypes={nodeTypesMerged}
            nodesDraggable={editMode} nodesConnectable={editMode} elementsSelectable={editMode}
            fitView minZoom={0.1}
          >
            <Background color="#1e293b" gap={24} size={2} variant={BackgroundVariant.Dots} />
            <Controls className="fill-slate-400 bg-slate-800 border-slate-700" />
          </ReactFlow>
        </div>

        {/* 🖥️ 下方：Terminal & Monitor 控制台底座 (Bottom Panel) */}
        <div className={`w-full bg-[#0E121B] border-t border-slate-800/60 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] flex flex-col transition-all duration-300 z-20 ${isBottomPanelOpen ? 'h-[320px]' : 'h-10'}`}>
          
          {/* 控制台顶部 Tab 栏 */}
          <div className="h-10 px-4 flex justify-between items-center bg-[#0B0F19] border-b border-slate-800/60 cursor-pointer hover:bg-[#0E121B] transition-colors" onClick={() => setIsBottomPanelOpen(!isBottomPanelOpen)}>
            <div className="flex items-center gap-4 h-full">
              <div className="flex items-center gap-2 h-full border-b-2 border-blue-500 text-blue-400 px-2">
                <TerminalSquare size={14} />
                <span className="text-[11px] font-bold tracking-wider uppercase">Execution Console</span>
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
              </div>
            </div>
            <button className="text-slate-500 hover:text-slate-300">
              {isBottomPanelOpen ? <ChevronDown size={16} /> : <Maximize2 size={14} />}
            </button>
          </div>

          {/* 控制台内容区 (左右并排：视频推流 + 日志流) */}
          {isBottomPanelOpen && (
            <div className="flex-1 flex overflow-hidden">
              
              {/* 左栏：Monitor (40% 宽度) */}
              <div className="w-[40%] border-r border-slate-800/60 flex flex-col bg-[#050505] p-4 relative group">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-orange-500/80 via-amber-400/50 to-transparent"></div>
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-[10px] font-bold text-orange-500 tracking-widest flex items-center gap-1.5">● PLAYSTREAM MONITOR</h2>
                  <span className="text-[9px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">Real-time</span>
                </div>
                <div className="flex-1 rounded-lg border border-slate-800/80 bg-[#0B0F19] flex items-center justify-center text-slate-600 text-xs font-mono relative overflow-hidden shadow-inner group-hover:border-slate-700 transition-colors">
                  <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.03),transparent_70%)]"></div>
                  Waiting for Emobodied Action...
                </div>
              </div>

              {/* 右栏：Logs (60% 宽度) */}
              <div className="flex-1 flex flex-col bg-[#050505] p-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-[10px] font-bold text-blue-500 tracking-widest flex items-center gap-1.5"><span className="text-blue-500/70">▶_</span> SYSTEM LOGS</h2>
                </div>
                <div className="flex-1 rounded-lg border border-slate-800/80 bg-[#0B0F19] p-3 font-mono text-[11px] text-slate-300 overflow-y-auto space-y-2.5 shadow-inner custom-scrollbar">
                  {logs.length === 0 && <div className="text-slate-600 italic">No logs generated. Click "Run Flow" to start engine.</div>}
                  {logs.map((log, idx) => {
                    let colorClass = 'text-slate-300';
                    if (log.includes('❌') || log.includes('🛑')) colorClass = 'text-red-400 font-bold';
                    else if (log.includes('✅')) colorClass = 'text-emerald-400';
                    else if (log.includes('🚀')) colorClass = 'text-blue-400 font-bold';
                    else if (log.includes('⚙️')) colorClass = 'text-amber-400/90';
                    return <div key={idx} className={`leading-relaxed break-words ${colorClass}`}>{log}</div>;
                  })}
                  <div ref={logEndRef} />
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* ✏️ 极右侧：仅在编排模式下出现的 Node Properties 配置面板 */}
      {/* ========================================================= */}
      {editMode && (
        <div className="w-[320px] bg-[#0E121B] border-l border-slate-800/60 flex flex-col shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-30">
          <div className="p-5 border-b border-slate-800/60 flex items-center gap-2 bg-[#0B0F19] shrink-0">
            <Settings2 size={18} className="text-slate-400"/>
            <h2 className="text-sm font-bold text-slate-200">Node Properties</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
            {!selectedNode ? (
              <div className="text-center py-20 text-xs text-slate-500 leading-loose flex flex-col items-center gap-3">
                <Network size={32} className="text-slate-700/50" />
                <p>点击左侧画布中的任意节点或连线<br/>查看并修改详细配置</p>
              </div>
            ) : (
              <div className="animate-in fade-in duration-200 space-y-6">
                
                <div className="bg-[#050505] p-4 rounded-lg border border-slate-800/80 shadow-inner">
                  <div className="text-[9px] font-bold tracking-widest uppercase text-indigo-500 mb-1.5 flex items-center gap-1.5"><Network size={12}/> {selectedNode.type}</div>
                  <div className="text-[15px] font-bold text-slate-200">{selectedNode.data.label || '未命名'}</div>
                  <div className="text-[10px] font-mono text-slate-600 mt-1">{selectedNode.id}</div>
                </div>

                {insights && (
                  <div className="bg-orange-950/20 border border-orange-500/40 rounded-xl p-4 relative overflow-hidden shadow-[0_4px_20px_rgba(249,115,22,0.05)]">
                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]"></div>
                    <h4 className="text-[12px] font-bold text-orange-400 flex items-center gap-1.5 mb-3"><Sparkles size={14} className="animate-pulse"/> Optimizer Agent 迭代建议</h4>
                    <div className="text-[11px] text-orange-300/80 leading-relaxed mb-4 space-y-2">
                      <p><strong className="text-orange-300">📊 运行体检：</strong>该节点过去 30 天触发人工接管 <span className="font-mono font-bold text-red-400 bg-red-950/50 px-1.5 py-0.5 rounded border border-red-500/30">{insights.failCount}</span> 次。</p>
                      <p><strong className="text-orange-300">🔍 根因分析：</strong>{insights.reason}</p>
                      <p><strong className="text-orange-300">🛠 修复建议：</strong>{insights.suggestion}</p>
                    </div>
                    <button onClick={handleAutoFix} className="w-full bg-orange-500/20 hover:bg-orange-500/40 border border-orange-500/50 text-orange-400 text-xs font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md">✨ 一键采纳建议并重写配置</button>
                  </div>
                )}

                <div>
                  <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-3 border-b border-slate-800 pb-1.5">Basic Settings</div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1.5">展示名称</label>
                    <input className="w-full bg-[#050505] border border-slate-700/80 text-slate-200 text-xs rounded-md px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner" value={selectedNode.data.label || ''} onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })} />
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-3 border-b border-slate-800 pb-1.5">Mounted Components</div>
                  {selectedNode.data.components?.map((comp: any, idx: number) => (
                    <div key={idx} className="bg-[#050505] border border-slate-800/80 rounded-lg p-3 mb-2 shadow-inner group">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-800/50 px-1.5 py-0.5 rounded border border-slate-700/50">[{comp.type}]</span>
                        <span className="text-[11px] font-mono text-indigo-400 font-bold">{comp.tool_name}</span>
                      </div>
                      {comp.params?.max_retries && (
                         <div className="flex justify-between items-center text-[10px] mt-2.5 border-t border-slate-800/60 pt-2.5"><span className="text-slate-500 font-mono">Max Retries:</span><span className="text-emerald-400 font-mono bg-emerald-950/30 px-1.5 rounded border border-emerald-900/50">{comp.params.max_retries}</span></div>
                      )}
                    </div>
                  ))}
                  <button className="w-full border border-dashed border-slate-700/70 text-slate-500 hover:text-slate-300 hover:border-slate-500 hover:bg-slate-800/30 text-[10px] font-bold py-2 rounded-lg transition-all mt-3">+ 挂载新原子动作</button>
                </div>

                <div>
                  <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-3 border-b border-slate-800 pb-1.5">Auditor & Guards</div>
                  <div className="flex items-start gap-3 p-3.5 bg-slate-900/40 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-900 transition-colors">
                    <input type="checkbox" className="mt-1" checked={!!selectedNode.data.interrupt_before} onChange={(e) => updateNodeData(selectedNode.id, { interrupt_before: e.target.checked })} />
                    <div>
                      <div className="text-[12px] font-bold text-slate-200 mb-1">执行前强制挂起 (HITL)</div>
                      <div className="text-[9px] text-slate-500 leading-relaxed">开启后，流程运行到此节点将触发 Auditor 熔断，必须由人类在 Inbox 中放行。</div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}