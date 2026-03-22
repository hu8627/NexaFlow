import React, { useState, useRef, useEffect } from 'react';
import { Hash, Users, Bot, Send, Plus, Search, AtSign, Paperclip, Smile, MoreVertical, TerminalSquare, Network, Blocks, Loader2 } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

export default function Workspace() {
  const { setCurrentView, setActiveFlow } = useUIStore();
  const [input, setInput] = useState('');
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  
  // 💡 动态状态：频道与消息流
  const [channels, setChannels] = useState<any[]>([]);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 驻场数字员工 (这些其实也应该从 /api/agents 拉，这里为了演示群聊先简化)
  const agents = [
    { id: 'a_writer', name: '文案小李', role: 'Copywriter', status: 'online', color: 'bg-pink-500' },
    { id: 'a_data', name: '数据老王', role: 'Data Analyst', status: 'busy', color: 'bg-blue-500' },
    { id: 'a_cs', name: '客服专员', role: 'Customer Success', status: 'online', color: 'bg-emerald-500' },
  ];

  // 1. 初始化拉取频道数据
  useEffect(() => {
    fetch('http://localhost:8000/api/workspaces')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data.length > 0) {
          setChannels(data.data);
          setActiveChannel(data.data[0].id); // 默认选中第一个
        }
        setLoading(false);
      });
  }, []);

  // 滚动到底部
  const currentMessages = channels.find(c => c.id === activeChannel)?.messages || [];
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  // 2. 同步单个频道的最新记录到 FileDB
  const syncChannelToDb = async (channelData: any) => {
    await fetch('http://localhost:8000/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(channelData)
    });
  };

  // 3. 发送消息逻辑
  const handleSend = () => {
    if (!input.trim() || !activeChannel) return;

    const newMsg = { 
      id: `msg_${Date.now()}`, 
      type: 'human', 
      user: '产品经理 (我)', 
      text: input, 
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      isAction: false
    };

    // 更新本地状态并同步给后端
    setChannels(prev => {
      const updated = prev.map(c => {
        if (c.id === activeChannel) {
          const updatedChannel = { ...c, messages: [...c.messages, newMsg] };
          syncChannelToDb(updatedChannel); // 💡 落盘！
          return updatedChannel;
        }
        return c;
      });
      return updated;
    });

    setInput('');

    // 💡 模拟 Agent 回复（如果包含了 @小李）
    if (input.includes('小李') || input.includes('文案')) {
      setTimeout(() => {
        const botMsg = {
          id: `msg_${Date.now()}`, type: 'agent', agentId: 'a_writer', agentName: '文案小李',
          text: '老板，您刚才提到了我。我是文案 Agent。这是我根据上下文为您生成的任务执行卡片，请过目。',
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          isAction: true,
          actionCard: { title: '智能推文分发 SOP', nodes: 4, target: '多渠道发布' }
        };
        
        setChannels(prev => {
          const updated = prev.map(c => {
            if (c.id === activeChannel) {
              const updatedChannel = { ...c, messages: [...c.messages, botMsg] };
              syncChannelToDb(updatedChannel); // 💡 Bot 发的卡片也落盘！
              return updatedChannel;
            }
            return c;
          });
          return updated;
        });
      }, 1500);
    }
  };

  if (loading) return <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500"><Loader2 className="animate-spin mb-4" size={32} /></div>;

  return (
    <div className="flex h-full w-full bg-slate-900 overflow-hidden text-slate-200">
      
      {/* ========================================== */}
      {/* 左侧：频道与私信 */}
      {/* ========================================== */}
      <div className="w-64 bg-[#0B0F19] border-r border-slate-800/60 flex flex-col z-10 shrink-0">
        <div className="h-14 border-b border-slate-800/60 px-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/30 transition-colors">
          <div className="font-bold text-sm text-slate-100 flex items-center gap-2 truncate">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-xs text-white shadow-[0_0_10px_rgba(79,70,229,0.5)]">B</div>
            BizFlow Workspace
          </div>
          <MoreVertical size={16} className="text-slate-500" />
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          <div>
            <div className="px-4 flex items-center justify-between mb-2 group">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-400">Channels (场景)</span>
              <Plus size={14} className="text-slate-500 cursor-pointer hover:text-slate-300" />
            </div>
            <div className="space-y-0.5 px-2">
              {channels.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => setActiveChannel(c.id)}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-all ${activeChannel === c.id ? 'bg-indigo-600/20 text-indigo-400 font-bold' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'}`}
                >
                  <div className="flex items-center gap-2 truncate text-sm">
                    <Hash size={14} className="opacity-70" />
                    <span className="truncate">{c.name}</span>
                  </div>
                  {c.unread > 0 && <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 rounded-full">{c.unread}</span>}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="px-4 flex items-center justify-between mb-2 group">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-400">Agents (驻场员工)</span>
              <Plus size={14} className="text-slate-500 cursor-pointer hover:text-slate-300" />
            </div>
            <div className="space-y-0.5 px-2">
              {agents.map(a => (
                <div key={a.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-slate-400 hover:bg-slate-800/50 hover:text-slate-300 transition-all">
                  <div className="relative">
                    <div className={`w-5 h-5 rounded ${a.color} flex items-center justify-center text-[10px] text-white font-bold`}><Bot size={12}/></div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0B0F19] ${a.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  </div>
                  <span className="truncate text-sm">{a.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* 中间：群聊记录区 */}
      {/* ========================================== */}
      <div className="flex-1 flex flex-col relative bg-slate-900">
        
        <div className="h-14 border-b border-slate-800/60 px-6 flex items-center justify-between bg-slate-950/30 backdrop-blur-sm z-10 shrink-0">
          <div>
            <h2 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <Hash size={18} className="text-slate-500" /> 
              {channels.find(c => c.id === activeChannel)?.name}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">{channels.find(c => c.id === activeChannel)?.desc}</p>
          </div>
          <div className="flex items-center gap-4">
            <Search size={18} className="text-slate-500 cursor-pointer hover:text-slate-300" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {currentMessages.map((msg: any) => {
            if (msg.type === 'system') {
              return (
                <div key={msg.id} className="flex items-center gap-4 px-4 py-2">
                  <div className="flex-1 h-px bg-slate-800/50"></div>
                  <span className="text-[10px] text-slate-500">{msg.text}</span>
                  <div className="flex-1 h-px bg-slate-800/50"></div>
                </div>
              );
            }
            
            const isAgent = msg.type === 'agent';
            const agentData = isAgent ? agents.find(a => a.id === msg.agentId) : null;
            
            return (
              <div key={msg.id} className={`flex gap-4 group ${!isAgent ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-md ${!isAgent ? 'bg-slate-800 text-slate-300' : (agentData?.color || 'bg-blue-600') + ' text-white'}`}>
                  {!isAgent ? <Users size={20} /> : <Bot size={20} />}
                </div>

                <div className={`flex flex-col max-w-[75%] ${!isAgent ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-baseline gap-2 mb-1.5 ${!isAgent ? 'flex-row-reverse' : ''}`}>
                    <span className="font-bold text-sm text-slate-200">{!isAgent ? msg.user : msg.agentName}</span>
                    {isAgent && <span className="bg-indigo-500/20 text-indigo-400 text-[9px] px-1.5 py-0.5 rounded border border-indigo-500/30">APP / BOT</span>}
                    <span className="text-[10px] text-slate-500">{msg.time}</span>
                  </div>
                  
                  <div className={`text-[13px] leading-relaxed p-3.5 rounded-2xl ${!isAgent ? 'bg-indigo-600 text-white rounded-tr-sm shadow-[0_0_15px_rgba(79,70,229,0.2)]' : 'bg-slate-800 border border-slate-700 text-slate-300 rounded-tl-sm'}`}>
                    {msg.text.split('\n').map((line: string, i: number) => (<p key={i} className={i > 0 ? 'mt-1' : ''}>{line}</p>))}
                  </div>

                  {/* Agent 的 SOP 卡片 */}
                  {isAgent && msg.isAction && msg.actionCard && (
                    <div className="mt-3 w-80 bg-slate-950 border border-slate-700 rounded-lg overflow-hidden shadow-lg group-hover:border-indigo-500/50 transition-colors cursor-pointer">
                      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-2"><TerminalSquare size={14} className="text-indigo-400"/> {msg.actionCard.title}</span>
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="text-[10px] text-slate-500 flex items-center gap-1.5"><Network size={12}/> Nodes: {msg.actionCard.nodes}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1.5"><Blocks size={12}/> Target: {msg.actionCard.target}</div>
                        </div>
                        <button 
                          onClick={() => { setCurrentView('studio'); setActiveFlow('flow_sdr_001'); }}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold py-1.5 px-3 rounded shadow-md transition-colors"
                        >
                          审阅 / 执行
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={endOfMessagesRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 pt-0 bg-slate-900 shrink-0">
          <div className="bg-[#151923] border border-slate-700 focus-within:border-indigo-500 rounded-xl overflow-hidden transition-all shadow-inner">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={`在 #${channels.find(c => c.id === activeChannel)?.name} 中发送指令... (输入 @ 唤醒具体员工)`}
              className="w-full bg-transparent text-slate-200 text-sm p-4 outline-none resize-none max-h-32 min-h-[60px]"
            />
            <div className="bg-[#1A1F2B] px-3 py-2 flex items-center justify-between border-t border-slate-800/80">
              <div className="flex items-center gap-1 text-slate-400">
                <button className="p-1.5 hover:bg-slate-800 rounded transition-colors"><AtSign size={16} /></button>
              </div>
              <button 
                onClick={handleSend} disabled={!input.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-1.5 rounded-lg transition-all shadow-md"
              >
                <Send size={16} className={input.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}