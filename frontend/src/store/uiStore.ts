import { create } from 'zustand';

// 💡 新增了 'integrations' 视图
type ViewType = 'chat' | 'workbench' | 'studio' | 'agents' | 'models' | 'skills' | 'integrations' | 'assets' | 'monitor' | 'ledger';

interface UIState {
  currentView: ViewType;
  activeFlowId: string | null;
  setCurrentView: (view: ViewType) => void;
  setActiveFlow: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentView: 'models', 
  activeFlowId: null,
  setCurrentView: (view) => set({ currentView: view, activeFlowId: null }),
  setActiveFlow: (id) => set({ activeFlowId: id }),
}));