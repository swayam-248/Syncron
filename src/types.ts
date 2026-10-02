export type SyncStatus = 'synced' | 'pending_push' | 'pending_delete';

export interface Note {
  id: string; // v4 UUID
  title: string;
  content: string;
  createdAt: number; // timestamp in ms
  updatedAt: number; // timestamp in ms
  syncStatus: SyncStatus;
  deletedAt: number | null; // soft-delete / tombstone timestamp
  icon?: string;
  tags?: string[];
  pinned?: boolean;
}

export type NetworkStatus = 'online' | 'offline' | 'syncing';
