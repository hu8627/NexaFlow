import React from 'react';
import { X } from 'lucide-react';

export default function SublaneNode({ data, id }: any) {
  const { editMode, onDeleteSublane } = data;

  return (
    <div className="w-full h-full border-l border-dashed border-slate-700/60 bg-slate-900/10 flex flex-col relative group">
      {/* 泳道头部 (Sublane Header) */}
      <div className="h-8 border-b border-dashed border-slate-700/60 flex items-center justify-between px-3 bg-slate-800/30">
        
        {editMode ? (
          <input 
            className="bg-transparent text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-dashed border-slate-600 outline-none focus:border-blue-500 w-32" 
            defaultValue={data.label} 
            onChange={(e) => data.onUpdateLabel && data.onUpdateLabel(id, e.target.value)}
          />
        ) : (
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest truncate">{data.label}</div>
        )}

        {editMode && (
          <button onClick={() => onDeleteSublane(id)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
            <X size={12}/>
          </button>
        )}
      </div>
    </div>
  );
}