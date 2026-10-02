import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, createNote, updateNote, softDeleteNote, restoreNote, seedInitialNotesForUser } from './lib/db';
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

  // Seed sample notes for this specific user on first login if empty
  useEffect(() => {
    if (user?.id) {
      seedInitialNotesForUser(user.id);
    }
  }, [user?.id]);

  // Live Query from Dexie: Strictly fetch notes for the currently logged-in user where deletedAt is null
  const activeNotes = useLiveQuery(
    async () => {
      if (!userId) return [];
      const userNotes = await db.notes
        .where('user_id')
        .equals(userId)
        .filter((note) => note.deletedAt === null)
        .toArray();
      return userNotes.sort((a, b) => b.updatedAt - a.updatedAt);
    },
    [userId],
    [] // Fallback
  );

  // Live Query for Tombstoned Notes scoped to this user
  const tombstonedNotes = useLiveQuery(
    async () => {
      if (!userId) return [];
      const deletedUserNotes = await db.notes
        .where('user_id')
        .equals(userId)
        .filter((note) => note.deletedAt !== null)
        .toArray();
      return deletedUserNotes.sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
    },
    [userId],
    []
  );

  // Auto-select first note if none selected or if selected note was soft-deleted
  useEffect(() => {
    if (activeNotes && activeNotes.length > 0) {
      if (!selectedNoteId || !activeNotes.some((n) => n.id === selectedNoteId)) {
        setSelectedNoteId(activeNotes[0].id);
      }
    } else if (activeNotes && activeNotes.length === 0) {
      setSelectedNoteId(null);
    }
  }, [activeNotes, selectedNoteId]);

  // Find the currently active note from live query
  const activeNote = activeNotes?.find((n) => n.id === selectedNoteId) || null;

  // Handle New Note: Inserts UUID v4 record tied to user.id into Dexie & selects it
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
      console.error('Failed to create new note in Dexie:', err);
    }
  };

  // Handle Note Auto-Save: Persists changes directly to Dexie with pending_push
  const handleUpdateNote = async (updatedFields: Partial<Note>) => {
    if (!selectedNoteId) return;
    try {
      await updateNote(selectedNoteId, updatedFields);
    } catch (err) {
      console.error('Failed to auto-save note to Dexie:', err);
    }
  };

  // Handle Soft Delete (Tombstoning)
  const handleDeleteNote = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await softDeleteNote(id);
    } catch (err) {
      console.error('Failed to soft delete note in Dexie:', err);
    }
  };

  // Handle Restore of Tombstoned Note
  const handleRestoreNote = async (id: string) => {
    try {
      await restoreNote(id);
      setSelectedNoteId(id);
    } catch (err) {
      console.error('Failed to restore note:', err);
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
      {/* Sidebar Component with User-Scoped Live Dexie Data */}
      <Sidebar
        notes={activeNotes || []}
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
                <strong>Kill Switch Active (Simulated Offline):</strong> Network requests are blocked. Keystrokes & soft-deletes persist locally in IndexedDB with <code className="bg-amber-200/80 px-1 py-0.5 rounded font-mono text-[11px]">syncStatus: 'pending_push'</code>.
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
                Tombstones ({tombstonedNotes?.length || 0})
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
                <strong>No Internet Connection:</strong> You are currently offline. Syncron is running in full local-first mode.
              </span>
            </div>
            <span className="text-[10px] bg-rose-200/70 text-rose-900 px-2 py-0.5 rounded font-mono">
              IndexedDB Active
            </span>
          </div>
        )}

        {/* Distraction-Free Editor Area with Real-Time Dexie Auto-Save & Soft Delete */}
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
            These records still exist in Dexie (<code className="font-mono text-[10px]">SyncronDB.notes</code>) with <code className="font-mono text-[10px]">deletedAt &ne; null</code> for user <code className="font-mono text-[10px]">{userId.substring(0, 8)}...</code>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 py-2">
            {(!tombstonedNotes || tombstonedNotes.length === 0) ? (
              <p className="text-xs text-slate-400 text-center py-8">No tombstoned notes in database.</p>
            ) : (
              tombstonedNotes.map((note) => (
                <div key={note.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                  <div className="font-medium text-slate-800 truncate">{note.title}</div>
                  <div className="text-[10px] text-slate-400 font-mono">ID: {note.id.substring(0, 8)}...</div>
                  <div className="text-[10px] text-rose-600 font-medium">
                    deletedAt: {note.deletedAt ? new Date(note.deletedAt).toLocaleTimeString() : 'N/A'}
                  </div>
                  <div className="text-[10px] text-amber-600 font-mono">syncStatus: '{note.syncStatus}'</div>
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
          <span>Initializing workspace session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <SyncronWorkspace />;
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
