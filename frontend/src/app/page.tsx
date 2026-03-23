//  Copyright (C) 2024 NexaFlow Team (charismamikoo@gmail.com)
//  This file is part of NexaFlow.
//  NexaFlow is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License.
'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useExecStore } from '@/store/execStore';
import { 
  MessageSquare, Network, Cpu, Wrench, Database, 
  Blocks, ShieldAlert, Users, Archive, Inbox, Hash, 
  ChevronRight, ChevronDown, Search, Settings, Command, Quote,
  FilePlus2, Loader2 // 💡 补上了这两个关键图标
} from 'lucide-react';

import FlowCanvas from '@/components/canvas/FlowCanvas';
import ModelHub from '@/components/dashboard/ModelHub';
import SkillRegistry from '@/components/dashboard/SkillRegistry';
import IntegrationHub from '@/components/dashboard/IntegrationHub';
import MonitorHub from '@/components/dashboard/MonitorHub';
import LedgerView from '@/components/dashboard/LedgerView';
import AssetHub from '@/components/dashboard/AssetHub';
import AgentHub from '@/components/dashboard/AgentHub';
import Workbench from '@/components/dashboard/Workbench';
import Workspace from '@/components/dashboard/Workspace';
import ChatCopilot from '@/components/dashboard/ChatCopilot';
import PromptHub from '@/components/dashboard/PromptHub';

// ==============================================================================
// 🎨 组件：二级折叠菜单组
// ==============================================================================
const NavGroup = ({ title, children, defaultOpen = true }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="mb-4">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 mb-1.5 cursor-pointer text-slate-500 hover:text-slate-300 transition-colors group"
      >
        {isOpen ? <ChevronDown size={12} className="opacity-70 group-hover:opacity-100" /> : <ChevronRight size={12} className="opacity-70 group-hover:opacity-100" />}
        <span className="text-[10px] font-bold uppercase tracking-wider">{title}</span>
      </div>
      {isOpen && <div className="space-y-0.5 px-2">{children}</div>}
    </div>
  );
};

// ==============================================================================
// 💡 组件：Studio 左侧的图纸列表侧边栏 (Flow Explorer)
// ==============================================================================
const FlowListSidebar = () => {
  const { activeFlowId, setActiveFlow } = useUIStore();
  const [flows, setFlows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/flows')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') setFlows(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-4"><Loader2 size={16} className="animate-spin text-slate-500" /></div>;
  if (flows.length === 0) return <div className="text-center p-4 text-xs text-slate-600">资产库空空如也</div>;

  return (
    <div className="space-y-1">
      {flows.map(f => (
        <div 
          key={f.id} 
          onClick={() => setActiveFlow(f.id)}
          className={`px-3 py-2.5 rounded-lg cursor-pointer transition-all flex flex-col gap-1 border ${
            activeFlowId === f.id 
              ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' 
              : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
          }`}
        >
          <div className="text-xs font-bold truncate">{f.name}</div>
          <div className="text-[9px] font-mono opacity-60 truncate">{f.id}</div>
        </div>
      ))}
    </div>
  );
};

// ==============================================================================
// 主界面：NexaFlow OS 壳子
// ==============================================================================
export default function NexaFlowOS() {
  const { currentView, setCurrentView, activeFlowId } = useUIStore();
  const { connectWs, logs } = useExecStore();
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { connectWs(); }, [connectWs]);
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  const NavItem = ({ id, icon, label }: { id: any, icon: any, label: string }) => {
    const isActive = currentView === id;
    return (
      <button 
        onClick={() => setCurrentView(id)}
        className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-md transition-all text-sm ${
          isActive 
            ? 'bg-blue-600/15 text-blue-400 font-medium' 
            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
        }`}
      >
        <span className={isActive ? "text-blue-400" : "text-slate-500"}>{icon}</span>
        <span>{label}</span>
      </button>
    );
  };

  return (
    <main className="flex h-screen w-screen bg-[#0B0F19] overflow-hidden select-none">
      
      {/* 1. 现代化桌面级侧边栏 */}
      <div className="w-60 border-r border-slate-800/60 bg-[#0E121B] flex flex-col z-20 shrink-0">
        
        <div className="p-4 pt-6">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-sm font-black text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]">N</div>
            <h1 className="font-bold text-slate-100 tracking-wide text-lg">NexaFlow</h1>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-md px-3 py-1.5 flex items-center justify-between text-slate-500 hover:border-slate-700 transition-colors cursor-text">
            <div className="flex items-center gap-2 text-xs">
              <Search size={14} /> Search...
            </div>
            <div className="flex items-center gap-0.5 opacity-60">
              <Command size={10} /> <span className="text-[10px] font-mono">K</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
          <NavGroup title="Collaboration">
            <NavItem id="workspace" icon={<Hash size={16} />} label="Workspace" />
            <NavItem id="chat" icon={<MessageSquare size={16} />} label="Copilot" />
            <NavItem id="workbench" icon={<Inbox size={16} />} label="Inbox" />
          </NavGroup>

          <NavGroup title="Orchestration">
            <NavItem id="studio" icon={<Network size={16} />} label="Studio (Flows)" />
            <NavItem id="agents" icon={<Users size={16} />} label="Agents" />
          </NavGroup>

          <NavGroup title="Assets & Config">
            <NavItem id="assets" icon={<Archive size={16} />} label="Business Assets" />
            <NavItem id="prompts" icon={<Quote size={16} />} label="Prompts" /> 
            <NavItem id="models" icon={<Cpu size={16} />} label="Models" />
            <NavItem id="skills" icon={<Wrench size={16} />} label="Skills" />
            <NavItem id="integrations" icon={<Blocks size={16} />} label="Integrations" />
          </NavGroup>

          <NavGroup title="Governance">
            <NavItem id="monitor" icon={<ShieldAlert size={16} />} label="Guards" />
            <NavItem id="ledger" icon={<Database size={16} />} label="Ledger" />
          </NavGroup>
        </div>

        <div className="p-4 border-t border-slate-800/60 flex items-center gap-3 hover:bg-slate-800/40 cursor-pointer transition-colors mt-auto">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
            Me
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-200 truncate">Architect</div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Local Engine</div>
          </div>
          <Settings size={16} className="text-slate-500" />
        </div>

      </div>

      {/* 2. 主工作区路由 */}
      <div className="flex-1 relative overflow-hidden flex flex-col bg-slate-900">
        {currentView === 'workspace' && <Workspace />}
        {currentView === 'chat' && <ChatCopilot />}
        {currentView === 'workbench' && <Workbench />}
        {currentView === 'agents' && <AgentHub />}
        {currentView === 'assets' && <AssetHub />}
        {currentView === 'prompts' && <PromptHub />}
        {currentView === 'models' && <ModelHub />}
        {currentView === 'skills' && <SkillRegistry />}
        {currentView === 'integrations' && <IntegrationHub />}
        {currentView === 'monitor' && <MonitorHub />}
        {currentView === 'ledger' && <LedgerView />}

        {/* 🌟 核心：Studio 的三栏式 IDE 布局 */}
        {currentView === 'studio' && (
          <div className="flex-1 flex w-full h-full bg-[#0B0F19] overflow-hidden">
            
            {/* 中间栏：Flows Explorer */}
            <div className="w-[280px] bg-[#0E121B] border-r border-slate-800/60 flex flex-col shrink-0 z-10 shadow-[5px_0_15px_rgba(0,0,0,0.2)]">
              <div className="p-4 border-b border-slate-800/60 shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2"><Network size={16} className="text-blue-500"/> Flows Explorer</h2>
                  <button className="text-slate-400 hover:text-blue-400 transition-colors" title="新建空白流程图">
                    <FilePlus2 size={16} />
                  </button>
                </div>
                <div className="bg-[#050505] border border-slate-800 rounded-md px-3 py-1.5 flex items-center text-slate-500 focus-within:border-blue-500 transition-colors shadow-inner">
                  <Search size={14} className="mr-2" />
                  <input type="text" placeholder="搜索图纸..." className="bg-transparent border-none outline-none text-xs w-full text-slate-200 placeholder-slate-600" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                <FlowListSidebar />
              </div>
            </div>

            {/* 右侧大区：画布 (内部自带右侧大屏逻辑) */}
            <div className="flex-1 relative flex flex-col min-w-0 bg-[#050505]">
              {!activeFlowId ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                  <Network size={48} className="text-slate-800 mb-4 stroke-1"/>
                  <h3 className="text-slate-300 font-bold mb-2 text-lg">No Flow Selected</h3>
                  <p className="text-sm mb-6 max-w-sm text-center opacity-80">请在左侧文件树中选择一个业务流图纸，或点击右上角新建一张空白画布。</p>
                  <button className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-6 rounded-lg transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                    + 创建新图纸 (New Flow)
                  </button>
                </div>
              ) : (
                <FlowCanvas />
              )}
            </div>

          </div>
        )}
      </div>

    </main>
  );
}