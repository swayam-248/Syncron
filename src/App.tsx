import { useState, useEffect, useMemo } from 'react';
import { PowerSyncContext, useQuery } from '@powersync/react';
import { 
  powersync, 
  createNote, 
  updateNote, 
  softDeleteNote, 
  restoreNote, 
  seedInitialNotesForUser 
} from './lib/powersync';
import { connector } from './lib/connector';
import { Note } from './types';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { Editor } from './components/Editor';
import { AuthPage } from './components/AuthPage';
import { NetworkProvider, useNetwork } from './context/NetworkContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AlertCircle, WifiOff, Archive, RotateCcw, Loader2 } from 'lucide-react';

function SyncronWorkspace() {
  const { user } = useAuth();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [showTombstoneDrawer, setShowTombstoneDrawer] = useState<boolean>(false);

  const { effectiveStatus, isKillSwitchActive } = useNetwork();
  const userId = user?.id || 'anonymous';

  // Manage PowerSync sync connection driven by Supabase user session
  useEffect(() => {
    if (!user) {
      powersync.disconnect().catch((err) => {
        console.warn('[Syncron PowerSync] Disconnect error:', err);
      });
      return;
    }

    // Connect PowerSync WebAssembly SQLite to backend sync rules
    powersync.connect(connector).catch((err) => {
      console.info('[Syncron PowerSync] Connection note:', err.message || err);
    });

    return () => {
      powersync.disconnect().catch(() => {});
    };
  }, [user?.id]);

  // Seed sample notes in PowerSync WebAssembly SQLite on first user login
  useEffect(() => {
    if (user?.id) {
      seedInitialNotesForUser(user.id);
    }
  }, [user?.id]);

  // PowerSync Live Query: Fetch all non-deleted notes ordered by updated_at descending
  const { data: rawActiveNotes = [] } = useQuery<any>(
    'SELECT * FROM notes WHERE deleted_at IS NULL ORDER BY updated_at DESC'
  );

  // PowerSync Live Query: Fetch all tombstoned notes
  const { data: rawTombstonedNotes = [] } = useQuery<any>(
    'SELECT * FROM notes WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC'
  );

  // Map PowerSync records to Note interface
  const activeNotes: Note[] = useMemo(() => {
    return rawActiveNotes.map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      title: r.title || 'Untitled Note',
      content: r.content || '',
      createdAt: Number(r.created_at) || Date.now(),
      updatedAt: Number(r.updated_at) || Date.now(),
      syncStatus: r.sync_status || 'synced',
      deletedAt: r.deleted_at ? Number(r.deleted_at) : null,
      icon: r.icon || '📝',
      tags: typeof r.tags === 'string' ? r.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : (r.tags || []),
      pinned: Boolean(r.pinned),
    }));
  }, [rawActiveNotes]);

  const tombstonedNotes: Note[] = useMemo(() => {
    return rawTombstonedNotes.map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      title: r.title || 'Untitled Note',
      content: r.content || '',
      createdAt: Number(r.created_at) || Date.now(),
      updatedAt: Number(r.updated_at) || Date.now(),
      syncStatus: r.sync_status || 'synced',
      deletedAt: r.deleted_at ? Number(r.deleted_at) : null,
      icon: r.icon || '📝',
      tags: typeof r.tags === 'string' ? r.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : (r.tags || []),
      pinned: Boolean(r.pinned),
    }));
  }, [rawTombstonedNotes]);

  // Auto-select first note if none selected or if selected note was soft-deleted
  useEffect(() => {
    if (activeNotes.length > 0) {
      if (!selectedNoteId || !activeNotes.some((n) => n.id === selectedNoteId)) {
        setSelectedNoteId(activeNotes[0].id);
      }
    } else if (activeNotes.length === 0) {
      setSelectedNoteId(null);
    }
  }, [activeNotes, selectedNoteId]);

  // Find the currently active note
  const activeNote = activeNotes.find((n) => n.id === selectedNoteId) || null;

  // Handle New Note: Executes PowerSync SQL INSERT
  const handleNewNote = async () => {
    if (!user?.id) return;
    try {
      const newNote = await createNote(user.id, {
        title: 'Untitled Note',
        content: '# Untitled Note\n\nStart typing here...',
        icon: '📝',
        tags: ['Draft'],
      });
      setSelectedNoteId(newNote.id);
    } catch (err) {
      console.error('Failed to create new note via PowerSync SQL:', err);
    }
  };

  // Handle Note Auto-Save: Executes PowerSync SQL UPDATE
  const handleUpdateNote = async (updatedFields: Partial<Note>) => {
    if (!selectedNoteId) return;
    try {
      await updateNote(selectedNoteId, updatedFields);
    } catch (err) {
      console.error('Failed to auto-save note via PowerSync SQL:', err);
    }
  };

  // Handle Soft Delete: Executes PowerSync SQL UPDATE (deleted_at = ?)
  const handleDeleteNote = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await softDeleteNote(id);
    } catch (err) {
      console.error('Failed to soft delete note via PowerSync SQL:', err);
    }
  };

  // Handle Restore of Tombstoned Note
  const handleRestoreNote = async (id: string) => {
    try {
      await restoreNote(id);
      setSelectedNoteId(id);
    } catch (err) {
      console.error('Failed to restore note via PowerSync SQL:', err);
    }
  };

  // Global Keyboard Shortcuts (Ctrl+N, Cmd+N)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewNote();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user?.id]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-900 relative">
      {/* Sidebar Component with PowerSync SQLite Live Data */}
      <Sidebar
        notes={activeNotes}
        selectedNoteId={selectedNoteId}
        searchQuery={searchQuery}
        onSelectNote={setSelectedNoteId}
        onNewNote={handleNewNote}
        onSearchChange={setSearchQuery}
        onDeleteNote={(id, e) => handleDeleteNote(id, e)}
        isOpen={isSidebarOpen}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Navigation */}
        <TopNav
          activeNote={activeNote || undefined}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Dev Mode Banner (when Kill Switch is active) */}
        {isKillSwitchActive && (
          <div className="bg-amber-500/10 border-b border-amber-300/50 px-4 py-2 flex items-center justify-between text-xs text-amber-950 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong>Kill Switch Active (Simulated Offline):</strong> PowerSync cloud synchronization paused. Edits persist locally in WebAssembly SQLite with <code className="bg-amber-200/80 px-1 py-0.5 rounded font-mono text-[11px]">sync_status: 'pending_push'</code>.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded font-mono text-[10px]">
                <WifiOff className="w-3 h-3 inline" /> 🔴 Offline (Simulated)
              </span>
              <button
                onClick={() => setShowTombstoneDrawer(!showTombstoneDrawer)}
                className="flex items-center gap-1 text-[11px] font-medium text-amber-900 underline hover:text-amber-700 cursor-pointer"
              >
                <Archive className="w-3 h-3" />
                Tombstones ({tombstonedNotes.length})
              </button>
            </div>
          </div>
        )}

        {/* Browser Actual Offline Banner (when native connection drops) */}
        {!isKillSwitchActive && effectiveStatus === 'offline_actual' && (
          <div className="bg-rose-500/10 border-b border-rose-300/50 px-4 py-2 flex items-center justify-between text-xs text-rose-950 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>
                <strong>No Internet Connection:</strong> You are currently offline. Syncron is operating seamlessly with local WebAssembly SQLite.
              </span>
            </div>
            <span className="text-[10px] bg-rose-200/70 text-rose-900 px-2 py-0.5 rounded font-mono">
              Local SQLite Engine
            </span>
          </div>
        )}

        {/* Distraction-Free Editor Area with Real-Time PowerSync SQL Auto-Save & Soft Delete */}
        <Editor
          note={activeNote}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={(id) => handleDeleteNote(id)}
        />
      </div>

      {/* Tombstone Inspector Drawer for Dev Mode QA */}
      {showTombstoneDrawer && (
        <div className="fixed inset-y-0 right-0 w-80 bg-white/95 backdrop-blur-md shadow-2xl border-l border-slate-200 p-4 z-40 flex flex-col animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-slate-700" />
              <h3 className="font-semibold text-sm text-slate-900">Tombstoned Records</h3>
            </div>
            <button
              onClick={() => setShowTombstoneDrawer(false)}
              className="text-slate-400 hover:text-slate-700 text-sm p-1"
            >
              ×
            </button>
          </div>

          <div className="text-[11px] text-slate-500 py-2">
            These records exist in WebAssembly SQLite (<code className="font-mono text-[10px]">notes</code> table) with <code className="font-mono text-[10px]">deleted_at &ne; null</code> for cloud replication.
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 py-2">
            {tombstonedNotes.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No tombstoned notes in database.</p>
            ) : (
              tombstonedNotes.map((note) => (
                <div key={note.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                  <div className="font-medium text-slate-800 truncate">{note.title}</div>
                  <div className="text-[10px] text-slate-400 font-mono">ID: {note.id.substring(0, 8)}...</div>
                  <div className="text-[10px] text-rose-600 font-medium">
                    deleted_at: {note.deletedAt ? new Date(note.deletedAt).toLocaleTimeString() : 'N/A'}
                  </div>
                  <div className="text-[10px] text-amber-600 font-mono">sync_status: '{note.syncStatus}'</div>
                  <button
                    onClick={() => handleRestoreNote(note.id)}
                    className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restore Note
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RootApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-screen bg-slate-50 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-700 text-white flex items-center justify-center text-base font-bold shadow-soft">
          ⚡
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          <span>Initializing PowerSync workspace session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <PowerSyncContext.Provider value={powersync}>
      <SyncronWorkspace />
    </PowerSyncContext.Provider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NetworkProvider>
        <RootApp />
      </NetworkProvider>
    </AuthProvider>
  );
}
