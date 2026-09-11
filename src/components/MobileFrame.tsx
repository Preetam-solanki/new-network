import React from 'react';
import { Wifi, Battery, Signal, Smartphone } from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
  onExit: () => void;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children, onExit }) => {
  return (
    <div className="py-6 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] bg-slate-950/90">
      <div className="mb-3 flex items-center gap-3 text-xs text-slate-400">
        <span className="flex items-center gap-1 font-semibold text-emerald-400">
          <Smartphone className="w-4 h-4" /> Flutter / React-Native Cross-Platform Client Shell
        </span>
        <span>•</span>
        <button
          onClick={onExit}
          className="text-slate-400 hover:text-white underline cursor-pointer"
        >
          Exit to Desktop View
        </button>
      </div>

      {/* Smartphone Frame */}
      <div className="relative w-full max-w-[420px] h-[850px] bg-slate-900 border-[8px] border-slate-800 rounded-[44px] shadow-2xl overflow-hidden flex flex-col ring-1 ring-slate-700">
        {/* Dynamic Island / Speaker notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-50 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-slate-900 mr-2 border border-slate-800"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-slate-950"></div>
        </div>

        {/* Mobile Status Bar */}
        <div className="h-10 bg-slate-900 text-slate-300 px-6 flex items-center justify-between text-[11px] font-semibold select-none shrink-0 z-40 border-b border-slate-800/40">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <Signal className="w-3 h-3 text-slate-400" />
            <Wifi className="w-3 h-3 text-emerald-400" />
            <Battery className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        {/* Scrollable Screen Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-950 text-slate-100 scrollbar-none">
          {children}
        </div>

        {/* Bottom Home Indicator Bar */}
        <div className="h-6 bg-slate-950 flex items-center justify-center shrink-0 z-40">
          <div className="w-32 h-1 bg-slate-700 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
