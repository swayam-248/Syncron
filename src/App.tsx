import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, createNote, updateNote, softDeleteNote, seedInitialNotesIfEmpty } from './lib/db';
import { Note, NetworkStatus } from './types';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { Editor } from './components/Editor';
import { AlertCircle, WifiOff } from 'lucide-react';

export default function App() {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('online');
  const [devKillSwitchActive, setDevKillSwitchActive] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Initialize and seed Dexie DB on mount if empty
  useEffect(() => {
    seedInitialNotesIfEmpty();
  }, []);

  // Live Query from Dexie: Fetch all non-deleted notes ordered by updatedAt DESC
  const notes = useLiveQuery(
    async () => {
      const allNotes = await db.notes
        .filter((note) => note.deletedAt === null)
        .toArray();
      return allNotes.sort((a, b) => b.updatedAt - a.updatedAt);
    },
    [],
    [] // Default fallback before query resolution
  );

  // Auto-select first note if none selected or if selected note was deleted
  useEffect(() => {
    if (notes && notes.length > 0) {
      if (!selectedNoteId || !notes.some((n) => n.id === selectedNoteId)) {
        setSelectedNoteId(notes[0].id);
      }
    } else if (notes && notes.length === 0) {
      setSelectedNoteId(null);
    }
  }, [notes, selectedNoteId]);

  // Find the currently active note from live query
  const activeNote = notes?.find((n) => n.id === selectedNoteId) || null;

  // Handle Dev Mode Kill Switch Toggle
  const handleToggleKillSwitch = () => {
    const nextState = !devKillSwitchActive;
    setDevKillSwitchActive(nextState);
    if (nextState) {
      setNetworkStatus('offline');
    } else {
      setNetworkStatus('online');
    }
  };

  // Handle Network Status Toggle
  const handleToggleNetworkStatus = () => {
    setNetworkStatus((prev) => (prev === 'online' ? 'offline' : 'online'));
  };

  // Handle New Note: Inserts UUID v4 record into Dexie & selects it
  const handleNewNote = async () => {
    try {
      const newNote = await createNote({
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

  // Handle Note Auto-Save: Persists changes directly to Dexie
  const handleUpdateNote = async (updatedFields: Partial<Note>) => {
    if (!selectedNoteId) return;
    try {
      await updateNote(selectedNoteId, updatedFields);
    } catch (err) {
      console.error('Failed to auto-save note to Dexie:', err);
    }
  };

  // Handle Note Soft Delete (Tombstoning)
  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await softDeleteNote(id);
      // Selected note will be updated automatically by useLiveQuery effect
    } catch (err) {
      console.error('Failed to soft delete note in Dexie:', err);
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
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      {/* Sidebar Component with Live Dexie Data */}
      <Sidebar
        notes={notes || []}
        selectedNoteId={selectedNoteId}
        searchQuery={searchQuery}
        onSelectNote={setSelectedNoteId}
        onNewNote={handleNewNote}
        onSearchChange={setSearchQuery}
        onDeleteNote={handleDeleteNote}
        isOpen={isSidebarOpen}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Navigation */}
        <TopNav
          activeNote={activeNote || undefined}
          networkStatus={networkStatus}
          devKillSwitchActive={devKillSwitchActive}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onToggleKillSwitch={handleToggleKillSwitch}
          onToggleNetworkStatus={handleToggleNetworkStatus}
        />

        {/* Dev Mode Banner (when Kill Switch is active) */}
        {devKillSwitchActive && (
          <div className="bg-amber-500/10 border-b border-amber-300/40 px-4 py-2 flex items-center justify-between text-xs text-amber-900 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span className="font-medium">
                <strong>Dev Mode Active:</strong> Network kill switch is engaged. Edits are persisting to local Dexie IndexedDB with status <code className="bg-amber-200/70 px-1 py-0.5 rounded font-mono text-[11px]">pending_push</code>.
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded font-mono text-[10px]">
              <WifiOff className="w-3 h-3 inline" /> Offline Simulation
            </div>
          </div>
        )}

        {/* Distraction-Free Editor Area with Real-Time Dexie Auto-Save */}
        <Editor
          note={activeNote}
          onUpdateNote={handleUpdateNote}
        />
      </div>
    </div>
  );
}
