import { create } from 'zustand';

type ViewType = 'chat' | 'workspace' | 'studio' | 'agents' | 'models' | 'skills' | 'integrations' | 'assets' | 'monitor' | 'ledger' | 'workbench';

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