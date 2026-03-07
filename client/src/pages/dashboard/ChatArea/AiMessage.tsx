import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AiMessageProps {
  content: string;
  onOptionSelect?: (option: string) => void;
}

interface ClarificationData {
  type: "clarification";
  question: string;
  options: string[];
}

const AiMessage: React.FC<AiMessageProps> = ({ content, onOptionSelect }) => {
  const clarificationData = useMemo<ClarificationData | null>(() => {
    try {
      const parsed = JSON.parse(content);
      if (
        parsed &&
        typeof parsed === "object" &&
        parsed.type === "clarification"
      ) {
        return parsed as ClarificationData;
      }
    } catch {
      // Not valid JSON
    }
    return null;
  }, [content]);

  return (
    <div className="flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="size-8 rounded-lg bg-primary flex items-center justify-center shrink-0 mt-1">
        <span className="material-symbols-outlined text-white text-lg">
          smart_toy
        </span>
      </div>
      <div className="flex flex-col gap-1.5 max-w-[85%]">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Chief of AI
        </p>
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 leading-relaxed border border-slate-100 dark:border-slate-800 shadow-sm prose dark:prose-invert max-w-none">
          {clarificationData ? (
            <div className="flex flex-col gap-3">
              <p className="font-medium text-slate-700 dark:text-slate-300">
                {clarificationData.question}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {clarificationData.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => onOptionSelect?.(option)}
                    className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium hover:bg-primary/10 hover:border-primary/30 transition-colors text-slate-700 dark:text-slate-300 hover:text-primary dark:hover:text-primary"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          )}
        </div>
        {!clarificationData && (
          <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              title="Copy"
              onClick={() => navigator.clipboard.writeText(content)}
            >
              <span className="material-symbols-outlined text-sm">
                content_copy
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiMessage;
