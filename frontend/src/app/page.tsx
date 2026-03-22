'use client';
import React, { useEffect, useRef } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useExecStore } from '@/store/execStore';
import { MessageSquare, Network, Cpu, Wrench, Database, ArrowLeft, PlayCircle,Blocks,ShieldAlert,Users,Archive, Inbox,Hash } from 'lucide-react'; // 💡 引入 Blocks 图标
// 引入子系统视图
import FlowCanvas from '@/components/canvas/FlowCanvas';
import ModelHub from '@/components/dashboard/ModelHub';
import AgentHub from '@/components/dashboard/AgentHub'; 
import SkillRegistry from '@/components/dashboard/SkillRegistry';
import FlowList from '@/components/dashboard/FlowList'; 
import LedgerView from '@/components/dashboard/LedgerView';
import ChatCopilot from '@/components/dashboard/ChatCopilot';
import IntegrationHub from '@/components/dashboard/IntegrationHub'; 
import MonitorHub from '@/components/dashboard/MonitorHub'; 
import AssetHub from '@/components/dashboard/AssetHub'; 
import Workbench from '@/components/dashboard/Workbench'; 
import Workspace from '@/components/dashboard/Workspace'; 



export default function BizFlowOS() {
  const { currentView, setCurrentView, activeFlowId, setActiveFlow } = useUIStore();
  const { connectWs, startTask, logs } = useExecStore();
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { connectWs(); }, [connectWs]);
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  const NavItem = ({ id, icon, label }: { id: any, icon: any, label: string }) => {
    const isActive = currentView === id;
    return (
      <button 
        onClick={() => setCurrentView(id)}
        className={`w-full flex flex-col items-center justify-center gap-1.5 py-4 border-l-2 transition-all ${
          isActive ? 'border-blue-500 text-blue-400 bg-slate-900/50' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/30'
        }`}
      >
        {icon}
        <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
      </button>
    );
  };

  return (
    <main className="flex h-screen w-screen bg-slate-950 overflow-hidden">
      
      {/* 1. 全局导航栏 */}
      <div className="w-20 border-r border-slate-800 bg-black flex flex-col items-center py-4 z-20 shadow-xl flex-shrink-0">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-lg font-black text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] mb-8">B</div>
        <div className="flex-1 w-full space-y-2">
          {/* 区块 1：工作区 */}
          <NavItem id="workspace" icon={<Hash size={20} />} label="Workspace" /> 
          <NavItem id="chat" icon={<MessageSquare size={20} />} label="Copilot" />
          <NavItem id="workbench" icon={<Inbox size={20} />} label="Inbox" />
          <NavItem id="studio" icon={<Network size={20} />} label="Studio" />
          <div className="my-4 border-t border-slate-800 w-8 mx-auto"></div>
          
          {/* 区块 2：团队与资产 */}
          <NavItem id="agents" icon={<Users size={20} />} label="Agents" /> 
          <NavItem id="assets" icon={<Archive size={20} />} label="Assets" /> {/* 💡 新增这一行：业务资产 */}
          <div className="my-4 border-t border-slate-800 w-8 mx-auto"></div>
          
          {/* 区块 3：底层基建与审计 */}
          <NavItem id="models" icon={<Cpu size={20} />} label="Models" />
          <NavItem id="skills" icon={<Wrench size={20} />} label="Skills" />
          <NavItem id="integrations" icon={<Blocks size={20} />} label="Connects" /> 
          <NavItem id="monitor" icon={<ShieldAlert size={20} />} label="Guards" /> 
          <NavItem id="ledger" icon={<Database size={20} />} label="Ledger" />
        </div>
      </div>

      {/* 2. 动态主工作区 */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {currentView === 'workspace' && <Workspace />} {/* 💡 新增这行 */}
        {currentView === 'models' && <ModelHub />}
        {currentView === 'agents' && <AgentHub />} {/* 💡 新增这行 */}
        {currentView === 'skills' && <SkillRegistry />}
        {currentView === 'assets' && <AssetHub />} {/* 💡 新增这行 */}
        {currentView === 'integrations' && <IntegrationHub />} {/* 💡 新增这一行 */}
        {currentView === 'monitor' && <MonitorHub />} {/* 💡 新增这一行 */}
        {currentView === 'chat' && <ChatCopilot />}
        {currentView === 'ledger' && <LedgerView />}  {/* 💡 新增这一行 */}
        {currentView === 'workbench' && <Workbench />} {/* 💡 新增这行 */}


        {currentView === 'chat' && (
           <div className="flex-1 flex items-center justify-center text-slate-500 flex-col gap-4">
             <MessageSquare size={48} className="text-slate-700"/>
             <p className="font-mono text-sm">Chat / Intent Router 模块准备接入...</p>
           </div>
        )}
        
        {/* ======================================================== */}
        {/* 💡 核心改动：Studio 的状态细分 (列表 vs 详情画布) */}
        {/* ======================================================== */}
        {currentView === 'studio' && !activeFlowId && <FlowList />}

        {currentView === 'studio' && activeFlowId && (
          <div className="flex-1 flex w-full h-full bg-slate-900">
            {/* 画布区 */}
            <div className="flex-1 relative overflow-hidden flex flex-col">
              
              {/* 画布内的浮动控制条 */}
              <div className="absolute top-4 left-4 z-10 flex gap-3">
                <button 
                  onClick={() => setActiveFlow(null)} // 💡 返回列表
                  className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 backdrop-blur border border-slate-700 text-[10px] font-bold py-1.5 px-3 rounded transition-all flex items-center gap-1.5"
                >
                  <ArrowLeft size={12} /> BACK TO LIST
                </button>
                <button 
                  onClick={startTask} 
                  className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold py-1.5 px-3 border border-blue-500 rounded shadow-[0_0_10px_rgba(37,99,235,0.4)] transition-all flex items-center gap-1.5"
                >
                  <PlayCircle size={12}/> RUN FLOW
                </button>
              </div>

              {/* 引入拖拽画布 */}
              <div className="flex-1 relative">
                <FlowCanvas />
              </div>
            </div>

            {/* 右侧：具身大屏与日志 (原封不动) */}
            <div className="w-[400px] border-l border-slate-800 bg-slate-950 flex flex-col z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] flex-shrink-0">
              <div className="h-[45%] border-b border-slate-800 p-4 bg-black flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-[10px] font-bold text-orange-500 tracking-widest">● PLAYSTREAM MONITOR</h2>
                  <span className="text-[9px] text-slate-500 animate-pulse">Live</span>
                </div>
                <div className="flex-1 border border-slate-800 rounded bg-slate-900 flex items-center justify-center text-slate-600 text-xs font-mono relative overflow-hidden">
                   Waiting for Execution...
                </div>
              </div>
              <div className="flex-1 p-4 flex flex-col">
                <h2 className="text-[10px] font-bold text-blue-500 tracking-widest mb-2">EXECUTION LOGS</h2>
                <div className="flex-1 bg-slate-900 border border-slate-800 rounded p-3 font-mono text-[10px] text-slate-300 overflow-y-auto space-y-2">
                  {logs.length === 0 && <div className="text-slate-600">Waiting for task to start...</div>}
                  {logs.map((log, idx) => (
                    <div key={idx} className={`${log.includes('❌') || log.includes('🛑') ? 'text-red-400' : (log.includes('✅') ? 'text-green-400' : '')}`}>
                      {log}
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}