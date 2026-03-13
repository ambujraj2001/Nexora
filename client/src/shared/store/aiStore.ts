import { create } from 'zustand';
import { aiEventBus, type AIEvent } from '../../features/activity/aiEventBus';

export interface AIState {
  currentStatus: 'idle' | 'planning' | 'thinking' | 'executing' | 'responding';
  activityFeed: AIEvent[];
  activeAgents: Array<{
    id: string;
    name: string;
    role: 'planner' | 'executor' | 'researcher' | 'critic';
    status: 'idle' | 'thinking' | 'executing';
    currentAction?: string;
  }>;
  activeContext: {
    totalTokens: number;
    referencedIds: string[];
    memories: Array<{ id: string; title: string; tokens: number; content?: string }>;
    files: Array<{ id: string; name: string; tokens: number; content?: string }>;
    knowledge: Array<{ id: string; title: string; tokens: number; content?: string }>;
    toolsUsed: Array<{ id: string; name: string; timestamp: number }>;
  };
  
  // Actions
  setStatus: (status: AIState['currentStatus']) => void;
  addEvent: (event: AIEvent) => void;
  clearFeed: () => void;
  updateContext: (update: Partial<AIState['activeContext']>) => void;
  setAgents: (agents: AIState['activeAgents']) => void;
  updateAgent: (role: AIState['activeAgents'][0]['role'], update: Partial<AIState['activeAgents'][0]>) => void;
}

export const useAIStore = create<AIState>((set) => ({
  currentStatus: 'idle',
  activityFeed: [],
  activeAgents: [
    { id: '1', name: 'Planner', role: 'planner', status: 'idle' },
    { id: '2', name: 'Executor', role: 'executor', status: 'idle' },
    { id: '3', name: 'Researcher', role: 'researcher', status: 'idle' },
  ],
  activeContext: {
    totalTokens: 0,
    referencedIds: [],
    memories: [],
    files: [],
    knowledge: [],
    toolsUsed: [],
  },

  setStatus: (status) => set({ currentStatus: status }),
  addEvent: (event) => set((state) => ({ 
    activityFeed: [event, ...state.activityFeed].slice(0, 25) 
  })),
  clearFeed: () => set({ activityFeed: [] }),
  updateContext: (update) => set((state) => {
    const newContext = { ...state.activeContext, ...update };
    
    const memoryTokens = newContext.memories.reduce((sum, m) => sum + m.tokens, 0);
    const fileTokens = newContext.files.reduce((sum, f) => sum + f.tokens, 0);
    const knowledgeTokens = newContext.knowledge.reduce((sum, k) => sum + k.tokens, 0);
    
    newContext.totalTokens = memoryTokens + fileTokens + knowledgeTokens;
    
    return { activeContext: newContext };
  }),
  setAgents: (agents) => set({ activeAgents: agents }),
  updateAgent: (role, update) => set((state) => ({
    activeAgents: state.activeAgents.map(a => a.role === role ? { ...a, ...update } : a)
  })),
}));

// Auto-subscribe to the event bus
aiEventBus.subscribe((event: AIEvent) => {
  const store = useAIStore.getState();
  store.addEvent(event);

  // Update status and agents based on event type
  switch (event.type) {
    case 'input_received':
      store.setStatus('thinking');
      // Reset context for new turn
      store.updateContext({ referencedIds: [], memories: [], files: [], knowledge: [], toolsUsed: [] });
      store.activeAgents.forEach(a => store.updateAgent(a.role, { status: 'idle', currentAction: undefined }));
      break;

    case 'thinking':
    case 'intent_detected':
      store.setStatus('thinking');
      break;

    case 'planner_node_started':
    case 'plan_created':
      store.setStatus('planning');
      store.updateAgent('planner', { status: 'thinking', currentAction: 'Designing execution plan' });
      break;

    case 'planner_node_completed':
      store.updateAgent('planner', { status: 'idle', currentAction: undefined });
      break;

    case 'tool_discovery_started':
      store.updateAgent('planner', { status: 'thinking', currentAction: 'Discovering relevant tools' });
      break;

    case 'tool_execution_started':
    case 'tool_start':
      store.setStatus('executing');
      store.updateAgent('executor', { 
        status: 'executing', 
        currentAction: `Running ${event.data?.toolName || 'tool'}` 
      });
      if (event.data?.toolName) {
        store.updateContext({
          toolsUsed: [...store.activeContext.toolsUsed, {
            id: Math.random().toString(),
            name: event.data.toolName as string,
            timestamp: Date.now()
          }]
        });
      }
      break;

    case 'tool_execution_completed':
    case 'tool_complete':
      store.setStatus('thinking');
      store.updateAgent('executor', { status: 'idle', currentAction: undefined });
      break;

    case 'response_generating':
      store.setStatus('responding');
      break;

    case 'response_complete':
      store.setStatus('idle');
      store.activeAgents.forEach(a => store.updateAgent(a.role, { status: 'idle', currentAction: undefined }));
      break;

    case 'memory_search_started':
    case 'memory_lookup':
      store.updateAgent('researcher', { status: 'thinking', currentAction: 'Searching memories' });
      break;

    case 'context_updated':
      if (event.data) {
        const data = event.data as { 
          memories?: Array<{ id: string; title?: string; content?: string }>;
          files?: Array<{ id: string; name: string; content?: string }>;
          knowledge?: Array<{ id: string; title: string; content?: string }>;
        };
        
        const updates: Partial<AIState['activeContext']> = {};
        
        if (data.memories) {
          updates.memories = data.memories.map(m => ({
            id: m.id,
            title: m.title || m.content?.slice(0, 30) || 'Memory',
            content: m.content,
            tokens: Math.floor((m.content?.length || 0) / 4)
          }));
          updates.referencedIds = [...new Set([...store.activeContext.referencedIds, ...data.memories.map(m => m.id)])];
        }
        
        if (data.files) {
          updates.files = data.files.map(f => ({
            id: f.id,
            name: f.name,
            content: f.content,
            tokens: Math.floor((f.content?.length || 0) / 4)
          }));
        }

        if (data.knowledge) {
          updates.knowledge = data.knowledge.map(k => ({
            id: k.id,
            title: k.title,
            content: k.content,
            tokens: Math.floor((k.content?.length || 0) / 4)
          }));
        }

        store.updateContext(updates);
      }
      break;
  }
});
