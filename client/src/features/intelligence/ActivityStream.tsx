import React from 'react';
import { useAIStore, type AIState } from '../../shared/store/aiStore';
import { motion, AnimatePresence } from 'framer-motion';
import type { AIEvent } from '../activity/aiEventBus';

const getEventIcon = (type: AIEvent['type']) => {
  switch (type) {
    case 'input_received': return 'chat_bubble';
    case 'thinking': return 'bolt';
    case 'intent_detected': return 'troubleshoot';
    case 'plan_created': return 'architecture';
    case 'memory_search_started':
    case 'memory_lookup':
    case 'memory_scan': return 'psychology';
    case 'knowledge_lookup': return 'auto_stories';
    case 'tool_discovery_started': return 'search';
    case 'tool_execution_started':
    case 'tool_start': return 'construction';
    case 'tool_execution_completed':
    case 'tool_complete': return 'done';
    case 'response_generating': return 'stylus';
    case 'clarification_needed': return 'help';
    default: return 'radio_button_checked';
  }
};

const ActivityStream: React.FC = () => {
  const activityFeed = useAIStore((state: AIState) => state.activityFeed);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          AI Activity
        </h3>
        {activityFeed.length > 0 && (
          <button 
            onClick={() => useAIStore.getState().clearFeed()}
            className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      
      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        <AnimatePresence initial={false} mode="popLayout">
          {activityFeed.length === 0 ? (
            <motion.p 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-slate-400 italic"
            >
              No recent activity...
            </motion.p>
          ) : (
            activityFeed.map((event) => (
              <motion.div
                key={event.id}
                layout
                initial={{ opacity: 0, x: -10, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  mass: 1
                }}
                className="group flex items-start gap-2 p-2 rounded-lg bg-white dark:bg-background-dark/40 border border-slate-100 dark:border-border-dark hover:border-primary/20 shadow-sm"
              >
                <div className={`mt-0.5 size-6 rounded flex items-center justify-center shrink-0 ${
                  event.status === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' :
                  event.status === 'warning' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-500' :
                  event.status === 'pending' ? 'bg-primary/10 text-primary animate-pulse' : 'bg-slate-100 dark:bg-background-dark text-slate-400'
                }`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {getEventIcon(event.type)}
                  </span>
                </div>
                
                <div className="flex flex-col min-w-0 flex-1">
                  <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 leading-tight break-words">
                    {event.message}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                      {new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ActivityStream;
