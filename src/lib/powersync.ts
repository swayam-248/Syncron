import { PowerSyncDatabase, Schema, Table, column } from '@powersync/web';
import { v4 as uuidv4 } from 'uuid';
import { Note } from '../types';

/**
 * PowerSync Local Schema for WebAssembly SQLite.
 * Defines the local tables matching remote Supabase Postgres schema.
 */
export const NOTES_TABLE = 'notes';

export const notesTable = new Table(
  {
    title: column.text,
    content: column.text,
    created_at: column.integer,
    updated_at: column.integer,
    sync_status: column.text,
    deleted_at: column.integer,
    user_id: column.text,
    icon: column.text,
    tags: column.text,
    pinned: column.integer,
  },
  {
    indexes: {
      userIdIdx: ['user_id'],
      updatedAtIdx: ['updated_at'],
    },
  }
);

export const AppSchema = new Schema({
  notes: notesTable,
});

export type Database = (typeof AppSchema)['types'];
export type PowerSyncNote = Database['notes'];

const powerSyncEndpoint = import.meta.env.VITE_POWERSYNC_URL || '';

if (!powerSyncEndpoint) {
  console.info(
    '[Syncron PowerSync] VITE_POWERSYNC_URL is not configured yet. PowerSync client is running in local WebAssembly SQLite mode.'
  );
}

/**
 * Initialized PowerSync WebAssembly SQLite database client.
 */
export const powersync = new PowerSyncDatabase({
  schema: AppSchema,
  database: {
    dbFilename: 'syncron_powersync.db',
  },
});

/**
 * PowerSync SQL Write Operation: Create a new note
 */
export async function createNote(userId: string, custom?: Partial<Note>): Promise<Note> {
  const id = uuidv4();
  const now = Date.now();
  const title = custom?.title ?? 'Untitled Note';
  const content = custom?.content ?? '# Untitled Note\n\nStart typing here...';
  const icon = custom?.icon ?? '📝';
  const tagsString = custom?.tags ? custom.tags.join(',') : 'Draft';
  const pinned = custom?.pinned ? 1 : 0;
  const syncStatus = 'pending_push';

  await powersync.execute(
    `INSERT INTO notes (id, user_id, title, content, created_at, updated_at, sync_status, deleted_at, icon, tags, pinned)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, title, content, now, now, syncStatus, null, icon, tagsString, pinned]
  );

  return {
    id,
    user_id: userId,
    title,
    content,
    createdAt: now,
    updatedAt: now,
    syncStatus,
    deletedAt: null,
    icon,
    tags: tagsString.split(',').filter(Boolean),
    pinned: Boolean(pinned),
  };
}

/**
 * PowerSync SQL Write Operation: Update an existing note
 */
export async function updateNote(id: string, updates: Partial<Note>): Promise<void> {
  const now = Date.now();
  const tagsString = updates.tags ? updates.tags.join(',') : undefined;
  const pinnedInt = updates.pinned !== undefined ? (updates.pinned ? 1 : 0) : undefined;

  await powersync.execute(
    `UPDATE notes
     SET
       title = coalesce(?, title),
       content = coalesce(?, content),
       icon = coalesce(?, icon),
       tags = coalesce(?, tags),
       pinned = coalesce(?, pinned),
       sync_status = 'pending_push',
       updated_at = ?
     WHERE id = ?`,
    [
      updates.title ?? null,
      updates.content ?? null,
      updates.icon ?? null,
      tagsString ?? null,
      pinnedInt ?? null,
      now,
      id
    ]
  );
}

/**
 * PowerSync SQL Write Operation: Soft delete (Tombstone)
 */
export async function softDeleteNote(id: string): Promise<void> {
  const now = Date.now();
  await powersync.execute(
    `UPDATE notes
     SET
       deleted_at = ?,
       sync_status = 'pending_push',
       updated_at = ?
     WHERE id = ?`,
    [now, now, id]
  );
}

/**
 * PowerSync SQL Write Operation: Restore soft-deleted note
 */
export async function restoreNote(id: string): Promise<void> {
  const now = Date.now();
  await powersync.execute(
    `UPDATE notes
     SET
       deleted_at = NULL,
       sync_status = 'pending_push',
       updated_at = ?
     WHERE id = ?`,
    [now, id]
  );
}

/**
 * Seed sample welcoming notes in PowerSync WebAssembly SQLite
 */
export async function seedInitialNotesForUser(userId: string): Promise<void> {
  try {
    const existing = await powersync.getAll<any>(
      'SELECT id FROM notes WHERE user_id = ? LIMIT 1',
      [userId]
    );

    if (existing.length === 0) {
      const now = Date.now();
      const sampleNotes = [
        {
          id: uuidv4(),
          user_id: userId,
          title: '⚡ Welcome to Syncron (PowerSync Engine)',
          content: `# Welcome to Syncron ⚡\n\n**Syncron** is now powered by **PowerSync (WebAssembly SQLite)** with bi-directional Supabase cloud replication.\n\n---\n\n### Architectural Upgrades:\n- 🚀 **Full SQLite in WASM**: Embedded client SQLite replacing legacy IndexedDB wrappers.\n- 🔄 **Real-Time Push/Pull Sync**: Edits trigger instant \`uploadData\` push to Supabase.\n- 🧱 **Tombstone Sync**: Deletions execute SQL \`UPDATE deleted_at = ?\` for conflict-free replication.\n\n### Try it now:\n- Edit this document or create a new note (\`Ctrl+N\`)\n- Test offline mode via the **Kill Switch** in the top navigation!`,
          created_at: now - 3600000,
          updated_at: now,
          sync_status: 'synced',
          deleted_at: null,
          icon: '⚡',
          tags: 'PowerSync,Getting Started',
          pinned: 1,
        },
        {
          id: uuidv4(),
          user_id: userId,
          title: '📐 PowerSync SQL & Supabase Replication',
          content: `# PowerSync SQL & Supabase Replication 📐\n\nAll local operations execute standard parameterized SQL queries against the embedded SQLite database.\n\n\`\`\`sql\n-- Create Note\nINSERT INTO notes (id, user_id, title, content, created_at, updated_at, sync_status)\nVALUES (?, ?, ?, ?, ?, ?, 'pending_push');\n\n-- Tombstone Soft-Delete\nUPDATE notes SET deleted_at = ?, sync_status = 'pending_push' WHERE id = ?;\n\`\`\`\n\nThe PowerSync background connector queues and uploads changes reliably.`,
          created_at: now - 7200000,
          updated_at: now - 1800000,
          sync_status: 'synced',
          deleted_at: null,
          icon: '📐',
          tags: 'Architecture,SQLite',
          pinned: 0,
        },
        {
          id: uuidv4(),
          user_id: userId,
          title: '💡 Local-First Roadmap & Milestones',
          content: `# Local-First Roadmap 💡\n\n- [x] Day 1: Notion-style UI Shell & Navigation\n- [x] Day 2-3: Local persistence & Network Kill Switch\n- [x] Day 4-5: Supabase Auth & Multi-tenant isolation\n- [x] Day 7-8: PowerSync WASM SQLite & Read Pipeline\n- [x] Day 9: PowerSync Write Pipeline & Dexie Deprecation\n\n*Zero-latency SQLite write pipeline active.*`,
          created_at: now - 86400000,
          updated_at: now - 3600000,
          sync_status: 'synced',
          deleted_at: null,
          icon: '💡',
          tags: 'Roadmap',
          pinned: 0,
        },
      ];

      for (const n of sampleNotes) {
        await powersync.execute(
          `INSERT INTO notes (id, user_id, title, content, created_at, updated_at, sync_status, deleted_at, icon, tags, pinned)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [n.id, n.user_id, n.title, n.content, n.created_at, n.updated_at, n.sync_status, n.deleted_at, n.icon, n.tags, n.pinned]
        );
      }
    }
  } catch (err) {
    console.warn('[Syncron PowerSync] Seed error:', err);
  }
}
