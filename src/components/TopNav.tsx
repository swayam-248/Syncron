import React from 'react';
import { useStatus } from '@powersync/react';
import { 
  Wifi, 
  WifiOff, 
  PowerOff, 
  PanelLeftClose, 
  PanelLeft, 
  Layers,
  AlertTriangle,
  Radio,
  LogOut,
  User as UserIcon,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Note } from '../types';
import { useNetwork } from '../context/NetworkContext';
import { useAuth } from '../context/AuthContext';

interface TopNavProps {
  activeNote?: Note;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeNote,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const { 
    isKillSwitchActive, 
    toggleKillSwitch,
  } = useNetwork();

  const { user, signOut } = useAuth();
  const status = useStatus();

  // Determine PowerSync exact connection state
  const hasError = Boolean(status?.downloadError || status?.uploadError);
  const isConnecting = Boolean(status?.connecting || status?.downloading || status?.uploading);
  const isConnected = Boolean(status?.connected) && !hasError;
  const isOffline = !isConnected && !isConnecting && !hasError;

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

      {/* Right side: PowerSync Real-time Status, Kill Switch & User Sign Out */}
      <div className="flex items-center space-x-2.5">
        {/* Dynamic PowerSync Engine Status Indicator */}
        <div
          className={cn(
            "flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 shadow-soft border",
            isKillSwitchActive
              ? "bg-amber-50 text-amber-700 border-amber-200/80"
              : hasError
              ? "bg-rose-50 text-rose-700 border-rose-200/80"
              : isConnected
              ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
              : isConnecting
              ? "bg-amber-50 text-amber-700 border-amber-200/80"
              : "bg-slate-100 text-slate-600 border-slate-200/80"
          )}
          title={
            isKillSwitchActive
              ? "Kill Switch Active: PowerSync disconnected"
              : hasError
              ? `Sync Error: ${status?.downloadError?.message || status?.uploadError?.message || 'Replication error'}`
              : isConnected
              ? "PowerSync Connected: Real-time SQLite replication live"
              : isConnecting
              ? "PowerSync Connecting: Syncing changes with cloud..."
              : "PowerSync Offline: Operating in local WebAssembly SQLite mode"
          }
        >
          {/* Status Dot / Spinner */}
          <span className="relative flex h-2 w-2">
            {isConnected && !isKillSwitchActive && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={cn(
                "relative inline-flex rounded-full h-2 w-2",
                isKillSwitchActive
                  ? "bg-amber-500"
                  : hasError
                  ? "bg-rose-500"
                  : isConnected
                  ? "bg-emerald-500"
                  : isConnecting
                  ? "bg-amber-500"
                  : "bg-slate-400"
              )}
            />
          </span>

          {/* Status Text */}
          <span className="flex items-center gap-1">
            {isKillSwitchActive ? (
              <>
                <Radio className="w-3 h-3" />
                <span>Offline (Simulated)</span>
              </>
            ) : hasError ? (
              <>
                <AlertCircle className="w-3 h-3 text-rose-600" />
                <span>Sync Error</span>
              </>
            ) : isConnected ? (
              <>
                <Wifi className="w-3 h-3" />
                <span>Connected</span>
              </>
            ) : isConnecting ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-slate-500" />
                <span>Offline</span>
              </>
            )}
          </span>
        </div>

        {/* Dev Mode: Kill Switch Button */}
        <button
          onClick={toggleKillSwitch}
          title={
            isKillSwitchActive
              ? "Kill switch is active: Click to reconnect PowerSync"
              : "Click to disconnect PowerSync and simulate offline mode"
          }
          className={cn(
            "flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-200 cursor-pointer",
            isKillSwitchActive
              ? "bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-300/50 animate-pulse"
              : "bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 shadow-soft"
          )}
        >
          {isKillSwitchActive ? (
            <AlertTriangle className="w-3.5 h-3.5 text-white" />
          ) : (
            <PowerOff className="w-3.5 h-3.5 text-slate-500" />
          )}
          <span>Dev Mode: Kill Switch</span>
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.2 rounded font-mono uppercase tracking-wider font-semibold",
              isKillSwitchActive
                ? "bg-amber-700 text-white"
                : "bg-slate-100 text-slate-500"
            )}
          >
            {isKillSwitchActive ? 'ACTIVE' : 'OFF'}
          </span>
        </button>

        <div className="h-4 w-[1px] bg-slate-200 mx-0.5" />

        {/* User Account & Sign Out Button */}
        {user && (
          <div className="flex items-center space-x-1.5">
            <div 
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium max-w-[160px] truncate"
              title={`Logged in as ${user.email}`}
            >
              <UserIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate text-[11px]">{user.email}</span>
            </div>

            <button
              onClick={() => signOut()}
              title="Sign Out of Syncron"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200/60 transition-all cursor-pointer shadow-none hover:shadow-soft"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
