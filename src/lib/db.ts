import Dexie, { type Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';
import { Note } from '../types';

export class SyncronDatabase extends Dexie {
  notes!: Table<Note, string>;

  constructor() {
    super('SyncronDB');
    
    // Initial schema (version 1)
    this.version(1).stores({
      notes: 'id, updatedAt, deletedAt, syncStatus, createdAt'
    });

    // Version 2: Added user_id for multi-tenant account data isolation
    this.version(2).stores({
      notes: 'id, user_id, updatedAt, deletedAt, syncStatus, createdAt'
    }).upgrade((tx) => {
      // Clean migration for any existing local records
      return tx.table('notes').toCollection().modify((note) => {
        if (!note.user_id) {
          note.user_id = 'local-user';
        }
      });
    });
  }
}

export const db = new SyncronDatabase();

/**
 * Helper to create a new note with a v4 UUID tied to the authenticated user
 */
export async function createNote(userId: string, custom?: Partial<Note>): Promise<Note> {
  const now = Date.now();
  const newNote: Note = {
    id: uuidv4(),
    user_id: userId,
    title: custom?.title ?? 'Untitled Note',
    content: custom?.content ?? '# Untitled Note\n\nStart typing here...',
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending_push',
    deletedAt: null,
    icon: custom?.icon ?? '📝',
    tags: custom?.tags ?? ['Draft'],
    pinned: custom?.pinned ?? false,
  };

  await db.notes.add(newNote);
  return newNote;
}

/**
 * Helper to update a note and mark syncStatus as pending_push
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
 * Soft delete (Tombstoning) a note:
 * Sets deletedAt to current timestamp and syncStatus to 'pending_push'.
 */
export async function softDeleteNote(id: string): Promise<void> {
  const now = Date.now();
  await db.notes.update(id, {
    deletedAt: now,
    syncStatus: 'pending_push',
    updatedAt: now,
  });
}

/**
 * Restore a soft-deleted (tombstoned) note
 */
export async function restoreNote(id: string): Promise<void> {
  const now = Date.now();
  await db.notes.update(id, {
    deletedAt: null,
    syncStatus: 'pending_push',
    updatedAt: now,
  });
}

/**
 * Seed initial sample notes if user has zero notes in database
 */
export async function seedInitialNotesForUser(userId: string): Promise<void> {
  const userNotesCount = await db.notes.where('user_id').equals(userId).count();
  if (userNotesCount === 0) {
    const now = Date.now();
    const initialNotes: Note[] = [
      {
        id: uuidv4(),
        user_id: userId,
        title: '⚡ Welcome to Syncron',
        content: `# Welcome to Syncron ⚡\n\n**Syncron** is an ultra-fast, local-first Markdown workspace secured with Supabase Auth.\n\n---\n\n### Multi-Tenant Local Isolation:\n- 🔒 **User Data Ownership**: All notes are partitioned by your Supabase \`user_id\` in IndexedDB.\n- ⚡ **Zero-Latency**: Instant typing and navigation via reactive \`useLiveQuery\`.\n- 🧱 **Tombstone Sync**: Deletions update \`deletedAt\` timestamps without dropping local history.\n\n### Next Steps:\n- Edit this note directly or click **+ New Note**\n- Toggle the **Dev Mode: Kill Switch** to test simulated offline edits\n- Sign out and switch accounts to verify local data isolation!`,
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
        user_id: userId,
        title: '📐 Supabase Auth & Dexie Schema',
        content: `# Supabase Auth & Dexie Schema 📐\n\nNotes are securely associated with authenticated user sessions.\n\n\`\`\`typescript\ninterface Note {\n  id: string; // v4 UUID\n  user_id: string; // Authenticated Supabase User ID\n  title: string;\n  content: string;\n  createdAt: number;\n  updatedAt: number;\n  syncStatus: 'synced' | 'pending_push' | 'pending_delete';\n  deletedAt: number | null;\n}\n\`\`\`\n\nIndexedDB queries are scoped to your \`user_id\`, ensuring multi-tenant privacy on shared client machines.`,
        createdAt: now - 7200000,
        updatedAt: now - 1800000,
        syncStatus: 'synced',
        deletedAt: null,
        icon: '📐',
        tags: ['Architecture', 'Auth'],
        pinned: false,
      },
      {
        id: uuidv4(),
        user_id: userId,
        title: '💡 Local-First Roadmap',
        content: `# Local-First Roadmap 💡\n\n- [x] Day 1: Notion-style UI Shell & Navigation\n- [x] Day 2: Dexie.js IndexedDB schema + useLiveQuery\n- [x] Day 3: Network State Manager, Kill Switch & Tombstoning\n- [x] Day 4: Supabase Client Infrastructure\n- [x] Day 5: Supabase User Auth & Data Isolation\n- [ ] Day 6: Background Cloud Push/Pull Replication Engine\n\n*Zero-latency editing enabled.*`,
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
