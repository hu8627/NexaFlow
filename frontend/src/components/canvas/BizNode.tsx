// 在顶部引入 Zustand store
import { Handle, Position } from '@xyflow/react';
import { useExecStore } from '@/store/execStore';

// 修改你的 BizNode 组件内部：
export default function BizNode({ data, isConnectable }: any) {
  // 从全局状态获取当前高亮的节点 ID
  const currentNodeId = useExecStore((state) => state.currentNodeId);
  const isRunning = currentNodeId === data.id; // 判断自己是否正在运行

  const isInterrupt = data.interrupt_before;
  
  // 💡 魔法在这里：如果正在运行，边框变成亮蓝色，并且加上呼吸阴影！
  const bgColor = isInterrupt ? 'bg-orange-950/40' : (isRunning ? 'bg-blue-950/80' : 'bg-slate-900');
  const borderColor = isRunning ? 'border-blue-400' : (isInterrupt ? 'border-orange-500/50' : 'border-slate-700');
  const glow = isRunning 
    ? 'shadow-[0_0_20px_rgba(59,130,246,0.6)] animate-pulse' // 运行态高亮呼吸
    : (isInterrupt ? 'shadow-[0_0_15px_rgba(249,115,22,0.15)]' : '');

  return (
    <div className={`w-56 rounded-lg border-2 ${borderColor} ${bgColor} ${glow} p-3 text-slate-200 backdrop-blur-sm relative group`}>
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="w-3 h-3 bg-blue-500 border-2 border-slate-900" />
      
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-2">
        <div className={`w-6 h-6 rounded flex items-center justify-center text-xs ${isInterrupt ? 'bg-orange-600' : 'bg-blue-600'}`}>
          {isInterrupt ? '🛑' : '⚙️'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold truncate">{data.label}</div>
          <div className="text-[9px] text-slate-500 uppercase tracking-wider">{data.id}</div>
        </div>
      </div>

      <div className="space-y-1">
        {data.components?.map((comp: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between text-[10px] bg-slate-950/50 p-1.5 rounded border border-slate-800/50">
            <span className="text-slate-400 font-mono">[{comp.type.toUpperCase()}]</span>
            <span className="text-blue-400 font-mono truncate ml-2">{comp.tool_name}</span>
          </div>
        ))}
      </div>

      {isInterrupt && (
        <div className="mt-2 text-[9px] text-orange-400 font-bold bg-orange-950/50 p-1 rounded text-center border border-orange-900/50">
          AUDITOR MIGHT INTERRUPT HERE
        </div>
      )}

      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="w-3 h-3 bg-blue-500 border-2 border-slate-900" />
    </div>
  );
}