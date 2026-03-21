import { create } from 'zustand';

interface ExecState {
  currentNodeId: string | null;
  logs: string[];
  ws: WebSocket | null;
  connectWs: () => void;
  startTask: () => void;
  clearLogs: () => void;
}

export const useExecStore = create<ExecState>((set, get) => ({
  currentNodeId: null,
  logs: [],
  ws: null,

  connectWs: () => {
    if (get().ws) return;
    const socket = new WebSocket('ws://localhost:8000/ws/state');
    
    socket.onopen = () => set((state) => ({ logs: [...state.logs, "🔌 [System] WebSocket 已连接后端引擎"] }));
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'node_active') {
        set({ currentNodeId: data.node_id });
      } else if (data.type === 'log') {
        set((state) => ({ logs: [...state.logs, data.msg] }));
      }
    };
    
    socket.onclose = () => {
      set((state) => ({ logs: [...state.logs, "❌ [System] WebSocket 连接断开"], ws: null }));
    };

    set({ ws: socket });
  },

  startTask: () => {
    const { ws } = get();
    if (ws && ws.readyState === WebSocket.OPEN) {
      set({ logs: [], currentNodeId: null }); // 开始前清空日志
      ws.send('START_TASK_NORMAL');
    } else {
      set((state) => ({ logs: [...state.logs, "⚠️ 请先等待 WebSocket 连接..."] }));
    }
  },

  clearLogs: () => set({ logs: [], currentNodeId: null })
}));