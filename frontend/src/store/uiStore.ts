import { create } from 'zustand';

type ViewType = 'chat' | 'workspace' | 'studio' | 'agents' | 'models' | 'skills' | 'integrations' | 'assets' | 'prompts' | 'monitor' | 'ledger' | 'workbench';

interface UIState {
  currentView: ViewType;
  activeFlowId: string | null;
  setCurrentView: (view: ViewType) => void;
  setActiveFlow: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentView: 'workspace', // 默认进 Workspace 群聊
  activeFlowId: null,
  
  // 💡 修复：点击导航栏时，如果切到 Studio，不强制清空 activeFlowId，而是让它保持最后一次看的那张图
  setCurrentView: (view) => set((state) => ({ 
    currentView: view, 
    activeFlowId: view === 'studio' ? state.activeFlowId : null 
  })),
  
  setActiveFlow: (id) => set({ activeFlowId: id }),
}));