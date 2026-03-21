import React from 'react';
import { Plus, X } from 'lucide-react';

export default function PhaseNode({ data, id }: any) {
  const { editMode, onAddSublane, onDeletePhase } = data;

  return (
    <div className="w-full h-full bg-slate-900/40 border border-slate-700/80 rounded-xl overflow-hidden relative shadow-2xl flex flex-col">
      {/* 阶段头部 (Phase Header) */}
      <div className="h-[46px] bg-slate-800/80 border-b border-slate-700 flex items-center px-4 gap-3 shrink-0 backdrop-blur-md">
        <div className="text-[10px] font-black bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full uppercase tracking-widest border border-blue-500/30">
          {data.pill || 'PHASE'}
        </div>
        
        {/* 支持编排模式下的标题修改 */}
        {editMode ? (
          <input 
            className="bg-transparent text-sm font-bold text-slate-100 border-b border-dashed border-slate-500 outline-none focus:border-blue-500 w-40" 
            defaultValue={data.label} 
            onChange={(e) => data.onUpdateLabel && data.onUpdateLabel(id, e.target.value)}
          />
        ) : (
          <div className="text-sm font-bold text-slate-200 tracking-wide">{data.label}</div>
        )}

        <div className="text-[10px] text-slate-500 font-mono ml-2">{data.stats}</div>

        {/* 只有在 Edit Mode 才显示的增删按钮 */}
        {editMode && (
          <div className="ml-auto flex gap-2 pointer-events-auto">
            <button onClick={() => onAddSublane(id)} className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] px-2 py-1 rounded transition-colors">
              <Plus size={12}/> 子泳道
            </button>
            <button onClick={() => onDeletePhase(id)} className="flex items-center gap-1 border border-red-500/30 text-red-400 hover:bg-red-500/10 text-[10px] px-2 py-1 rounded transition-colors">
              <X size={12}/> 删除
            </button>
          </div>
        )}
      </div>
      
      {/* 留空区域：让 Sublane 并排填充 */}
      <div className="flex-1 w-full relative pointer-events-none"></div>
    </div>
  );
}