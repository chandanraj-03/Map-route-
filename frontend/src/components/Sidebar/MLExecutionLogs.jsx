import React, { useState, useEffect } from 'react';
import { Terminal } from 'lucide-react';

function MLExecutionLogs({ logs }) {
  const [displayedLogs, setDisplayedLogs] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (!logs || logs.length === 0) return;
    
    setDisplayedLogs([]);
    setIsTyping(true);
    let i = 0;
    
    const interval = setInterval(() => {
      if (i < logs.length) {
        const logToAppend = logs[i];
        const currentIndex = i;
        // Because of closure inside interval, better to use functional update
        setDisplayedLogs(prev => {
           // Prevents duplicate appending in React StrictMode
           if (prev.length > currentIndex) return prev; 
           return [...prev, logToAppend];
        });
        i++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 400); // 400ms delay between log lines for dramatic effect

    return () => clearInterval(interval);
  }, [logs]);

  if (!logs || logs.length === 0) return null;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-lg mb-4 mt-2">
      <div 
        className="bg-slate-200 px-4 py-2 flex justify-between items-center cursor-pointer border-b border-slate-300 hover:bg-slate-300 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h4 className="font-mono text-xs font-semibold text-emerald-700 flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          ML Engine Execution Logs
        </h4>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
        </div>
      </div>
      
      {isOpen && (
        <div className="p-4 font-mono text-[11px] leading-relaxed text-emerald-700 max-h-48 overflow-y-auto">
          {displayedLogs.map((log, idx) => {
            const isSystem = log.includes('[SYS]');
            const isOpt = log.includes('[OPT]');
            const isML = log.includes('[ML') || log.includes('[HEUR]');
            const isCache = log.includes('[CACHE]');
            const isError = log.includes('Error') || log.includes('Failed');
            
            let colorClass = "text-slate-500";
            if (isSystem) colorClass = "text-blue-600";
            if (isOpt) colorClass = "text-purple-600";
            if (isML) colorClass = "text-emerald-600";
            if (isCache) colorClass = "text-amber-600";
            if (isError) colorClass = "text-red-600";

            return (
              <div key={idx} className={`mb-1.5 break-words ${colorClass}`}>
                <span className="opacity-50 select-none mr-2">{'>'}</span>
                {log}
              </div>
            );
          })}
          {isTyping && (
            <div className="animate-pulse text-slate-500 mt-2">
              <span className="opacity-50 select-none mr-2">{'>'}</span>
              _
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MLExecutionLogs;
