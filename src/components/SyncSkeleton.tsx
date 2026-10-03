import React from 'react';
import { Loader2, CloudDownload } from 'lucide-react';

export const SyncSkeleton: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-900 animate-pulse">
      {/* Sidebar Skeleton */}
      <aside className="w-72 md:w-80 h-full flex flex-col bg-slate-50/90 border-r border-slate-200/70 p-4 space-y-4 flex-shrink-0">
        {/* Workspace Brand */}
        <div className="flex items-center space-x-2.5 pb-2">
          <div className="w-8 h-8 rounded-xl bg-slate-200" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-28 bg-slate-200 rounded" />
            <div className="h-2 w-20 bg-slate-200/70 rounded" />
          </div>
        </div>

        {/* Action Button & Search */}
        <div className="space-y-2">
          <div className="h-8 w-full bg-slate-200/80 rounded-xl" />
          <div className="h-8 w-full bg-slate-200/50 rounded-xl" />
        </div>

        {/* Note List Skeletons */}
        <div className="space-y-2 pt-2 flex-1">
          <div className="h-2 w-16 bg-slate-200 rounded mb-3" />
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-100/60">
              <div className="w-4 h-4 rounded bg-slate-200" />
              <div className="space-y-1 flex-1">
                <div className="h-2.5 bg-slate-200 rounded" style={{ width: `${60 + (item * 7) % 30}%` }} />
                <div className="h-2 w-14 bg-slate-200/60 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
          <div className="h-2.5 w-24 bg-slate-200 rounded" />
          <div className="h-2.5 w-12 bg-slate-200/60 rounded" />
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* TopNav Skeleton */}
        <header className="h-14 border-b border-slate-200/70 bg-white/80 px-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 rounded-lg bg-slate-200" />
            <div className="h-3 w-32 bg-slate-200 rounded" />
          </div>
          <div className="flex items-center space-x-2.5">
            <div className="h-7 w-24 rounded-full bg-slate-200" />
            <div className="h-7 w-32 rounded-xl bg-slate-200" />
          </div>
        </header>

        {/* Cloud Sync Floating Notice */}
        <div className="bg-blue-50/80 border-b border-blue-200/60 px-4 py-2 flex items-center justify-center gap-2 text-xs text-blue-800">
          <CloudDownload className="w-3.5 h-3.5 text-blue-600 animate-bounce" />
          <span className="font-medium">Downloading initial workspace data from Supabase cloud...</span>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600 ml-1" />
        </div>

        {/* Editor Body Canvas Skeleton */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 flex justify-center">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-card border border-slate-100 p-8 sm:p-12 space-y-6 min-h-[500px]">
            {/* Document Icon Placeholder */}
            <div className="w-10 h-10 rounded-xl bg-slate-200" />

            {/* Title Placeholder */}
            <div className="h-8 w-3/4 bg-slate-200 rounded-lg" />

            {/* Metadata Bar */}
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <div className="h-5 w-24 rounded-lg bg-slate-100" />
              <div className="h-5 w-20 rounded-lg bg-slate-100" />
              <div className="h-5 w-16 rounded-lg bg-slate-100" />
            </div>

            {/* Paragraph lines */}
            <div className="space-y-3 pt-2">
              <div className="h-3.5 bg-slate-100 rounded w-full" />
              <div className="h-3.5 bg-slate-100 rounded w-11/12" />
              <div className="h-3.5 bg-slate-100 rounded w-4/5" />
              <div className="h-3.5 bg-slate-100 rounded w-full" />
              <div className="h-3.5 bg-slate-100 rounded w-9/12" />
            </div>

            {/* Blockquote / Code Block placeholder */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="h-3 bg-slate-200/70 rounded w-1/2" />
              <div className="h-3 bg-slate-200/70 rounded w-2/3" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
