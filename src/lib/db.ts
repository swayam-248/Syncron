import Dexie, { type Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';
import { Note } from '../types';

export class SyncronDatabase extends Dexie {
  notes!: Table<Note, string>;

  constructor() {
    super('SyncronDB');
    
    // Schema definition for Dexie
    // id is primary key (string UUID)
    // Indexes on updatedAt, deletedAt, syncStatus, createdAt for fast queries & sync
    this.version(1).stores({
      notes: 'id, updatedAt, deletedAt, syncStatus, createdAt'
    });
  }
}

export const db = new SyncronDatabase();

/**
 * Helper to create a new note with a v4 UUID
 */
export async function createNote(custom?: Partial<Note>): Promise<Note> {
  const now = Date.now();
  const newNote: Note = {
    id: uuidv4(),
    title: custom?.title ?? 'Untitled Note',
    content: custom?.content ?? '# Untitled Note\n\nStart typing here...',
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending_push',
    deletedAt: null,
    icon: custom?.icon ?? '📝',
    tags: custom?.tags ?? ['Local'],
    pinned: custom?.pinned ?? false,
  };

  await db.notes.add(newNote);
  return newNote;
}

/**
 * Helper to update a note and set syncStatus to pending_push
 */
export async function updateNote(id: string, updates: Partial<Note>): Promise<void> {
  const now = Date.now();
  await db.notes.update(id, {
    ...updates,
    updatedAt: now,
    syncStatus: 'pending_push',
  });
}

/**
 * Soft delete (tombstoning) a note
 */
export async function softDeleteNote(id: string): Promise<void> {
  const now = Date.now();
  await db.notes.update(id, {
    deletedAt: now,
    syncStatus: 'pending_delete',
    updatedAt: now,
  });
}

/**
 * Seed initial sample notes if database is empty on first load
 */
export async function seedInitialNotesIfEmpty(): Promise<void> {
  const count = await db.notes.count();
  if (count === 0) {
    const now = Date.now();
    const initialNotes: Note[] = [
      {
        id: uuidv4(),
        title: '⚡ Welcome to Syncron',
        content: `# Welcome to Syncron ⚡\n\n**Syncron** is an ultra-fast, local-first Markdown workspace powered by client-side Dexie.js (IndexedDB).\n\n---\n\n### Core Local-First Features:\n- 🔒 **Local Persistence**: Notes are saved directly into your browser's IndexedDB.\n- ⚡ **Zero-Latency**: Instant reactivity via Dexie \`useLiveQuery\`.\n- 🧱 **Tombstone Soft Deletes**: Deleted records are tracked with \`deletedAt\` timestamps for cloud synchronization.\n\n### Try it now:\n- Edit this title or markdown content\n- Click **New Note** to generate a UUID v4 record\n- Test the **Dev Mode: Kill Switch** in the top bar to simulate offline states!`,
        createdAt: now - 3600000,
        updatedAt: now,
        syncStatus: 'synced',
        deletedAt: null,
        icon: '⚡',
        tags: ['Local-First', 'Getting Started'],
        pinned: true,
      },
      {
        id: uuidv4(),
        title: '📐 Distributed Schema & Tombstones',
        content: `# Distributed Schema & Tombstones 📐\n\nTo allow multi-device sync without conflicts, our Dexie database employs UUID primary keys and soft deletions.\n\n\`\`\`typescript\ninterface Note {\n  id: string; // v4 UUID\n  title: string;\n  content: string;\n  createdAt: number;\n  updatedAt: number;\n  syncStatus: 'synced' | 'pending_push' | 'pending_delete';\n  deletedAt: number | null; // Tombstoning\n}\n\`\`\`\n\nAll mutations set \`syncStatus: 'pending_push'\` and update \`updatedAt\`.`,
        createdAt: now - 7200000,
        updatedAt: now - 1800000,
        syncStatus: 'synced',
        deletedAt: null,
        icon: '📐',
        tags: ['Architecture', 'IndexedDB'],
        pinned: false,
      },
      {
        id: uuidv4(),
        title: '💡 Local-First Backlog',
        content: `# Local-First Backlog 💡\n\n- [x] Day 1: Notion-style UI Shell & Navigation\n- [x] Day 2: Dexie.js IndexedDB schema + useLiveQuery\n- [ ] Day 3: Background Replication & Sync Engine\n- [ ] Day 4: P2P Conflict Resolution with CRDTs\n\n*All changes auto-save in real-time.*`,
        createdAt: now - 86400000,
        updatedAt: now - 3600000,
        syncStatus: 'synced',
        deletedAt: null,
        icon: '💡',
        tags: ['Roadmap'],
        pinned: false,
      }
    ];

    await db.notes.bulkAdd(initialNotes);
  }
}
