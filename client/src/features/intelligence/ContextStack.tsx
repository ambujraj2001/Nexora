import React from 'react';
import { useAIStore, type AIState } from '../../shared/store/aiStore';
import { motion } from 'framer-motion';

type ContextItem = {
  id: string;
  title?: string;
  name?: string;
  tokens?: number;
  content?: string;
  timestamp?: number;
};

const Section: React.FC<{ 
  title: string; 
  icon: string; 
  color: string; 
  items: ContextItem[]; 
  renderItem: (item: ContextItem) => React.ReactNode 
}> = ({ title, icon, color, items, renderItem }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-1.5">
      <span className={`material-symbols-outlined text-[14px] ${color}`}>
        {icon}
      </span>
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
        {title} ({items.length})
      </span>
    </div>
    <div className="flex flex-col gap-1.5 pl-4">
      {items.length === 0 ? (
        <p className="text-[10px] text-slate-400 italic">No {title.toLowerCase()} active</p>
      ) : (
        items.map(renderItem)
      )}
    </div>
  </div>
);

const ContextStack: React.FC = () => {
  const { memories, files, knowledge, toolsUsed, totalTokens } = useAIStore((state: AIState) => state.activeContext);
  const tokenLimit = 8000;
  const tokenPercentage = Math.min((totalTokens / tokenLimit) * 100, 100);

  return (
    <div className="flex flex-col gap-4">
      {/* Token Awareness Indicator */}
      <div className="space-y-1.5 flex flex-col p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">AI Context Load</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            tokenPercentage > 80 ? 'bg-red-500/10 text-red-500' : 
            tokenPercentage > 50 ? 'bg-amber-500/10 text-amber-500' :
            'bg-indigo-500/10 text-indigo-500'
          }`}>
            {totalTokens.toLocaleString()} / {tokenLimit.toLocaleString()} tokens
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${tokenPercentage}%` }}
            className={`h-full rounded-full ${
              tokenPercentage > 80 ? 'bg-red-500' : 
              tokenPercentage > 50 ? 'bg-amber-500' : 
              'bg-indigo-500'
            }`}
          />
        </div>
      </div>

      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {/* Memories */}
        <Section 
          title="Memories" 
          icon="psychology" 
          color="text-indigo-500" 
          items={memories}
          renderItem={(m) => (
            <div key={m.id} className="group relative flex items-center justify-between p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <span className="text-[10px] text-slate-700 dark:text-slate-300 truncate max-w-[160px] cursor-help">
                {m.title}
              </span>
              <span className="text-[9px] text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-1 rounded">
                {m.tokens}t
              </span>
            </div>
          )}
        />

        {/* Files */}
        <Section 
          title="Files" 
          icon="description" 
          color="text-emerald-500" 
          items={files}
          renderItem={(f) => (
            <div key={f.id} className="flex items-center justify-between p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <span className="text-[10px] text-slate-700 dark:text-slate-300 truncate max-w-[160px]">{f.name}</span>
              <span className="text-[9px] text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-1 rounded">{f.tokens}t</span>
            </div>
          )}
        />

        {/* Knowledge */}
        <Section 
          title="Knowledge" 
          icon="auto_stories" 
          color="text-amber-500" 
          items={knowledge}
          renderItem={(k) => (
            <div key={k.id} className="group relative flex items-center justify-between p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <span className="text-[10px] text-slate-700 dark:text-slate-300 truncate max-w-[160px] cursor-help">{k.title}</span>
              <span className="text-[9px] text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-1 rounded">{k.tokens}t</span>
            </div>
          )}
        />

        {/* Tools Used */}
        <Section 
          title="Tools" 
          icon="construction" 
          color="text-rose-500" 
          items={toolsUsed}
          renderItem={(t) => (
            <div key={t.id} className="flex items-center justify-between p-1 rounded-lg">
              <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400">
                {t.name}
              </span>
              <span className="text-[8px] text-slate-400 font-mono">
                {t.timestamp ? new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </span>
            </div>
          )}
        />
      </div>
    </div>
  );
};

export default ContextStack;
