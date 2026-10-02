import React from 'react';
import { 
  Wifi, 
  WifiOff, 
  PowerOff, 
  PanelLeftClose, 
  PanelLeft, 
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { NetworkStatus, Note } from '../types';

interface TopNavProps {
  activeNote?: Note;
  networkStatus: NetworkStatus;
  devKillSwitchActive: boolean;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onToggleKillSwitch: () => void;
  onToggleNetworkStatus: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeNote,
  networkStatus,
  devKillSwitchActive,
  isSidebarOpen,
  onToggleSidebar,
  onToggleKillSwitch,
  onToggleNetworkStatus,
}) => {
  const isOnline = networkStatus === 'online';

  return (
    <header className="h-14 border-b border-slate-200/70 bg-white/80 backdrop-blur-md px-4 flex items-center justify-between z-10 select-none">
      {/* Left side: Sidebar Toggle & Breadcrumbs */}
      <div className="flex items-center space-x-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          title={isSidebarOpen ? "Collapse sidebar" : "Open sidebar"}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-4 h-4" />
          ) : (
            <PanelLeft className="w-4 h-4" />
          )}
        </button>

        <div className="h-4 w-[1px] bg-slate-200" />

        <div className="flex items-center space-x-2 text-xs text-slate-500 truncate">
          <span className="flex items-center gap-1.5 font-medium text-slate-600">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Syncron</span>
          </span>
          <span className="text-slate-300">/</span>
          <span className="truncate max-w-[200px] text-slate-700 font-medium">
            {activeNote ? activeNote.title : 'No note selected'}
          </span>
        </div>
      </div>

      {/* Right side: Network Status & Dev Kill Switch */}
      <div className="flex items-center space-x-3">
        {/* Network Status Badge */}
        <button
          onClick={onToggleNetworkStatus}
          title={isOnline ? "Network is Online (Click to simulate toggle)" : "Network is Offline"}
          className={cn(
            "flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer shadow-soft border",
            isOnline
              ? "bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100/70"
              : "bg-rose-50 text-rose-700 border-rose-200/80 hover:bg-rose-100/70"
          )}
        >
          <span className="relative flex h-2 w-2">
            {isOnline && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={cn(
                "relative inline-flex rounded-full h-2 w-2",
                isOnline ? "bg-emerald-500" : "bg-rose-500"
              )}
            ></span>
          </span>
          <span className="flex items-center gap-1">
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3" />
                <span>Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                <span>Offline (Local)</span>
              </>
            )}
          </span>
        </button>

        {/* Dev Mode: Kill Switch Button */}
        <button
          onClick={onToggleKillSwitch}
          className={cn(
            "flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 cursor-pointer",
            devKillSwitchActive
              ? "bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-300/50 animate-pulse"
              : "bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 shadow-soft"
          )}
        >
          {devKillSwitchActive ? (
            <AlertTriangle className="w-3.5 h-3.5 text-white" />
          ) : (
            <PowerOff className="w-3.5 h-3.5 text-slate-500" />
          )}
          <span>Dev Mode: Kill Switch</span>
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.2 rounded font-mono uppercase tracking-wider font-semibold",
              devKillSwitchActive
                ? "bg-amber-700 text-white"
                : "bg-slate-100 text-slate-500"
            )}
          >
            {devKillSwitchActive ? 'ACTIVE' : 'OFF'}
          </span>
        </button>

        {/* Sync Indicator Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-[11px] font-medium border border-slate-200/50">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Sync Ready</span>
        </div>
      </div>
    </header>
  );
};
