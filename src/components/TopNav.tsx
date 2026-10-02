import React from 'react';
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
  User as UserIcon
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
    effectiveStatus, 
    isKillSwitchActive, 
    toggleKillSwitch,
    isOnline
  } = useNetwork();

  const { user, signOut } = useAuth();

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

      {/* Right side: Network Status, Kill Switch & User Sign Out */}
      <div className="flex items-center space-x-2.5">
        {/* Network Status Badge */}
        <div
          className={cn(
            "flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 shadow-soft border",
            isOnline
              ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
              : effectiveStatus === 'offline_simulated'
              ? "bg-amber-50 text-amber-700 border-amber-200/80"
              : "bg-rose-50 text-rose-700 border-rose-200/80"
          )}
          title={
            isOnline
              ? "Connected: Real-time sync engine active"
              : effectiveStatus === 'offline_simulated'
              ? "Dev Mode: Network traffic blocked via Kill Switch"
              : "Device is disconnected from the internet"
          }
        >
          <span className="relative flex h-2 w-2">
            {isOnline && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={cn(
                "relative inline-flex rounded-full h-2 w-2",
                isOnline
                  ? "bg-emerald-500"
                  : effectiveStatus === 'offline_simulated'
                  ? "bg-amber-500"
                  : "bg-rose-500"
              )}
            />
          </span>
          <span className="flex items-center gap-1">
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3" />
                <span>Online</span>
              </>
            ) : effectiveStatus === 'offline_simulated' ? (
              <>
                <Radio className="w-3 h-3" />
                <span>Offline (Simulated)</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                <span>Offline (No Connection)</span>
              </>
            )}
          </span>
        </div>

        {/* Dev Mode: Kill Switch Button */}
        <button
          onClick={toggleKillSwitch}
          title={
            isKillSwitchActive
              ? "Kill switch is active: Click to restore network connection"
              : "Click to simulate dropped network connection"
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
