import React from 'react';
import { useAIStore, type AIState } from '../../shared/store/aiStore';
import { motion, AnimatePresence } from 'framer-motion';

const AgentsPanel: React.FC = () => {
  const agents = useAIStore((state: AIState) => state.activeAgents);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        Active Agents
      </h3>
      
      <div className="grid grid-cols-1 gap-2">
        <AnimatePresence>
          {agents.map((agent) => (
            <motion.div 
              key={agent.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              layout
              className={`p-3 rounded-xl border flex flex-col gap-2 transition-all duration-300 ${
                agent.status !== 'idle'
                  ? 'bg-primary/[0.03] border-primary/20 shadow-sm ring-1 ring-primary/10' 
                  : 'bg-slate-50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-black uppercase tracking-tight ${agent.status !== 'idle' ? 'text-primary' : 'text-slate-500'}`}>
                    {agent.name}
                  </span>
                  {agent.status !== 'idle' && (
                    <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                  agent.status === 'executing' ? 'bg-emerald-500/10 text-emerald-500' :
                  agent.status === 'thinking' ? 'bg-primary/10 text-primary' :
                  'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}>
                  {agent.status}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                  {agent.role}
                </span>
                <AnimatePresence mode="wait">
                  {agent.currentAction ? (
                    <motion.p 
                      key={agent.currentAction}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-tight"
                    >
                      {agent.currentAction}
                    </motion.p>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">Standby mode</p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AgentsPanel;
