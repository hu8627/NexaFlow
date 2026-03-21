import React, { useState } from 'react';
import { Inbox, CheckCircle2, XCircle, Clock, AlertTriangle, Eye, TerminalSquare, MessageSquare, PlayCircle } from 'lucide-react';

export default function Workbench() {
  // 模拟从后端拉取 "Suspended" (被挂起等待人类介入) 的任务流
  const [pendingTasks] = useState([
    {
      id: 'TASK-9921',
      flowName: '智能拓客与CRM录入',
      node: 'N3_CRM_Entry',
      reason: '需要人工确认敏感数据的写入',
      type: 'Confirm',
      submitter: 'Agent: SDR Bot',
      time: '10 mins ago',
      context: { company: 'Shopify', status: 'High Intent', email: 'contact@shopify.com' }
    },
    {
      id: 'TASK-9920',
      flowName: '自动化竞品爬取',
      node: 'N2_Scrape',
      reason: '检测到反爬虫滑块验证码，AI 无法通过',
      type: 'Intervention',
      submitter: 'Agent: Web Researcher',
      time: '1 hour ago',
      snapshot: 'https://via.placeholder.com/600x400/1e293b/94a3b8?text=Captcha+Image+Snapshot'
    }
  ]);

  const [activeTask, setActiveTask] = useState(pendingTasks[0]);

  return (
    <div className="flex h-full w-full bg-slate-900 overflow-hidden text-slate-200">
      
      {/* ========================================== */}
      {/* 1. 左侧：待办队列 (Task Inbox) 借鉴你的 KYC 左侧设计 */}
      {/* ========================================== */}
      <div className="w-[300px] bg-slate-950 border-r border-slate-800/60 flex flex-col z-10">
        <div className="p-4 border-b border-slate-800/60">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><Inbox className="text-blue-500" /> Workbench</h2>
          <div className="flex gap-2">
            <button className="flex-1 text-[11px] py-1.5 rounded bg-blue-600 text-white font-bold">待处理 ({pendingTasks.length})</button>
            <button className="flex-1 text-[11px] py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors">已完成</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {pendingTasks.map(task => (
            <div 
              key={task.id} 
              onClick={() => setActiveTask(task)}
              className={`p-3 rounded-lg cursor-pointer border-l-4 transition-all ${
                activeTask.id === task.id 
                  ? 'bg-slate-900 border-l-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.1)]' 
                  : 'bg-transparent border-l-transparent hover:bg-slate-900/50'
              }`}
            >
              <div className="flex justify-between items-start mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 font-mono">{task.id}</span>
                {task.type === 'Confirm' ? (
                  <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">CONFIRM</span>
                ) : (
                  <span className="text-[9px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/30 flex items-center gap-1 animate-pulse"><AlertTriangle size={10}/> FIX</span>
                )}
              </div>
              <div className="text-xs font-bold text-slate-200 mb-1 truncate">{task.flowName}</div>
              <div className="text-[10px] text-slate-500 truncate">{task.reason}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================== */}
      {/* 2. 中间：上下文大屏 (Task Context View) */}
      {/* ========================================== */}
      <div className="flex-1 flex flex-col relative bg-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800/60 bg-slate-950/30">
          <div>
            <h1 className="text-lg font-bold text-slate-100">{activeTask.flowName}</h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
              <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">{activeTask.id}</span>
              <span>挂起节点：<span className="text-orange-400 font-bold">{activeTask.node}</span></span>
              <span className="flex items-center gap-1"><Clock size={12}/> {activeTask.time}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 mr-2">由 {activeTask.submitter} 提交</span>
            <button className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs py-1.5 px-3 rounded flex items-center gap-1.5 transition-all">
              <MessageSquare size={14} /> 唤起 Chat
            </button>
          </div>
        </div>

        {/* 主视图区：展示 AI 留下的上下文或截图 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-orange-950/20 border border-orange-500/30 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="text-orange-500 mt-0.5" size={18} />
            <div>
              <div className="text-sm font-bold text-orange-400 mb-1">Human Intervention Required</div>
              <div className="text-xs text-orange-200/70">{activeTask.reason}</div>
            </div>
          </div>

          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
            <Eye size={14}/> Execution Context (执行上下文)
          </h3>

          {/* 根据任务类型动态渲染上下文 */}
          {activeTask.snapshot ? (
            <div className="border border-slate-700 rounded-lg overflow-hidden relative group">
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] font-mono text-slate-300 border border-slate-700">Live DOM Snapshot</div>
              <img src={activeTask.snapshot} alt="DOM Snapshot" className="w-full object-cover" />
              {/* 模拟允许人类在截图上点击 */}
              <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-crosshair">
                <span className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full shadow-lg font-bold">点击此处输入坐标</span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 space-y-2">
              {Object.entries(activeTask.context || {}).map(([k, v]) => (
                <div key={k} className="flex border-b border-slate-800/50 pb-2 last:border-0 last:pb-0">
                  <span className="w-32 text-slate-500">{k}:</span>
                  <span className="text-green-400">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================== */}
      {/* 3. 右侧：操作面板 (Action Panel) 借鉴 KYC 右侧 */}
      {/* ========================================== */}
      <div className="w-[320px] bg-slate-950 border-l border-slate-800/60 flex flex-col z-10 shadow-xl">
        <div className="p-4 border-b border-slate-800/60 flex items-center gap-2">
          <TerminalSquare size={16} className="text-slate-400"/>
          <h2 className="text-sm font-bold text-slate-200">Action Panel</h2>
        </div>

        <div className="flex-1 p-4 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">人工指令输入</h4>
            <textarea 
              rows={4} 
              placeholder="如果需要，输入人工补充信息（例如验证码字母、或者审批批注）..."
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-md p-2 outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* 终极决策按钮 */}
          <div className="mt-auto space-y-3">
            <button className="w-full bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-3 px-4 rounded transition-all shadow-[0_0_15px_rgba(22,163,74,0.3)] flex items-center justify-center gap-2">
              <CheckCircle2 size={16} /> 确认并放行 (Resume)
            </button>
            <button className="w-full bg-red-900/30 hover:bg-red-900/50 border border-red-500/50 text-red-400 text-xs font-bold py-3 px-4 rounded transition-all flex items-center justify-center gap-2">
              <XCircle size={16} /> 驳回并终止 (Terminate)
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}