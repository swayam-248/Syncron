import React from 'react';
import { Note } from '../types';
import { 
  Plus, 
  Search, 
  FileText, 
  Pin, 
  Trash2, 
  Sparkles,
  ChevronRight,
  FolderOpen,
  Hash,
  CloudUpload,
  CheckCircle2,
  Database
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  notes: Note[];
  selectedNoteId: string | null;
  searchQuery: string;
  onSelectNote: (id: string) => void;
  onNewNote: () => void;
  onSearchChange: (query: string) => void;
  onDeleteNote: (id: string, e: React.MouseEvent) => void;
  isOpen: boolean;
}

// Relative time formatting helper
function formatTime(timestamp: number): string {
  if (!timestamp) return 'Just now';
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 30) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const Sidebar: React.FC<SidebarProps> = ({
  notes,
  selectedNoteId,
  searchQuery,
  onSelectNote,
  onNewNote,
  onSearchChange,
  onDeleteNote,
  isOpen
}) => {
  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pinnedNotes = filteredNotes.filter(n => n.pinned);
  const regularNotes = filteredNotes.filter(n => !n.pinned);

  if (!isOpen) return null;

  return (
    <aside className="w-72 md:w-80 h-full flex flex-col bg-slate-50/90 backdrop-blur-md border-r border-slate-200/70 select-none transition-all duration-200 flex-shrink-0">
      {/* Workspace Header */}
      <div className="p-4 pb-3 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-700 flex items-center justify-center text-white shadow-sm font-semibold text-sm">
            ⚡
          </div>
          <div>
            <h1 className="font-semibold text-sm text-slate-900 tracking-tight leading-none">
              Syncron Workspace
            </h1>
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
              <Database className="w-2.5 h-2.5 text-emerald-600 inline" />
              IndexedDB • Local-First
            </span>
          </div>
        </div>
      </div>

      {/* Action / Search Section */}
      <div className="px-3.5 pb-2 space-y-2">
        {/* New Note Button */}
        <button
          onClick={onNewNote}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white hover:bg-slate-100/80 active:scale-[0.99] text-slate-800 font-medium text-xs shadow-soft border border-slate-200/60 transition-all duration-150 group cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-slate-100 group-hover:bg-slate-200 text-slate-700 transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <span>New Note</span>
          </span>
          <kbd className="text-[10px] text-slate-400 font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
            Ctrl+N
          </kbd>
        </button>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search notes, tags..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-200/50 hover:bg-slate-200/70 focus:bg-white text-xs pl-8 pr-3 py-2 rounded-xl border border-transparent focus:border-slate-300 focus:shadow-soft focus:outline-none transition-all placeholder:text-slate-400 text-slate-800"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-700 bg-slate-200/80 rounded-full px-1.5"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Navigation / Note Tree */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
        {/* Pinned section */}
        {pinnedNotes.length > 0 && (
          <div className="space-y-1">
            <div className="px-2 py-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <Pin className="w-3 h-3 text-slate-400" />
              <span>Pinned</span>
            </div>
            {pinnedNotes.map((note) => (
              <NoteListItem
                key={note.id}
                note={note}
                isSelected={selectedNoteId === note.id}
                onSelect={() => onSelectNote(note.id)}
                onDelete={(e) => onDeleteNote(note.id, e)}
              />
            ))}
          </div>
        )}

        {/* All Notes section */}
        <div className="space-y-1">
          <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <FolderOpen className="w-3 h-3 text-slate-400" />
              <span>All Documents</span>
            </span>
            <span className="text-[10px] text-slate-400 bg-slate-200/60 px-1.5 py-0.2 rounded-full font-mono">
              {filteredNotes.length}
            </span>
          </div>

          {filteredNotes.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-500" />
              <p>No notes found</p>
              {searchQuery ? (
                <p className="text-[11px] text-slate-400 mt-1">
                  Try a different search term
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-1">
                  Click 'New Note' to create your first document
                </p>
              )}
            </div>
          ) : (
            regularNotes.map((note) => (
              <NoteListItem
                key={note.id}
                note={note}
                isSelected={selectedNoteId === note.id}
                onSelect={() => onSelectNote(note.id)}
                onDelete={(e) => onDeleteNote(note.id, e)}
              />
            ))
          )}
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-slate-200/60 bg-slate-50/50">
        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-medium">Dexie.js LiveQuery</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">v4.0 UUIDs</span>
        </div>
      </div>
    </aside>
  );
};

interface NoteListItemProps {
  note: Note;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

const NoteListItem: React.FC<NoteListItemProps> = ({
  note,
  isSelected,
  onSelect,
  onDelete
}) => {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-all duration-150",
        isSelected
          ? "bg-white text-slate-900 shadow-soft font-medium"
          : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
      )}
    >
      <div className="flex items-center space-x-2.5 min-w-0 flex-1">
        <span className="text-sm flex-shrink-0">
          {note.icon || '📄'}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs flex items-center gap-1.5">
            <span className="truncate">{note.title || 'Untitled Note'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
            <span>{formatTime(note.updatedAt)}</span>
            <span>•</span>
            {/* Sync status tag */}
            {note.syncStatus === 'pending_push' ? (
              <span className="inline-flex items-center gap-0.5 text-amber-600 font-medium" title="Pending sync / Saved locally">
                <CloudUpload className="w-2.5 h-2.5" />
                <span>local</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-emerald-600" title="Synced">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>synced</span>
              </span>
            )}
            {note.tags && note.tags.length > 0 && (
              <>
                <span>•</span>
                <span className="truncate flex items-center gap-0.5">
                  <Hash className="w-2.5 h-2.5 inline" />
                  {note.tags[0]}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons on hover */}
      <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 pl-2 transition-opacity">
        <button
          onClick={onDelete}
          title="Soft delete note (Tombstone)"
          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
      </div>
    </div>
  );
};
