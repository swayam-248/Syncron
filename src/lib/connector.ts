import { 
  PowerSyncBackendConnector, 
  PowerSyncCredentials, 
  CommonPowerSyncDatabase, 
  UpdateType 
} from '@powersync/web';
import { supabase } from './supabase';

export class SupabaseConnector implements PowerSyncBackendConnector {
  /**
   * Fetches fresh Supabase JWT credentials for PowerSync authentication.
   * Returns null if user is not signed in.
   */
  async fetchCredentials(): Promise<PowerSyncCredentials | null> {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      throw new Error(`[Syncron PowerSync Connector] Auth error: ${error.message}`);
    }

    if (!session || !session.access_token) {
      return null;
    }

    const endpoint = import.meta.env.VITE_POWERSYNC_URL || '';
    if (!endpoint) {
      console.warn('[Syncron PowerSync Connector] VITE_POWERSYNC_URL is not configured.');
    }

    return {
      endpoint: endpoint,
      token: session.access_token,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : undefined,
    };
  }

  /**
   * Iterates through the local PowerSync CRUD transaction queue and executes
   * corresponding mutations (INSERT/UPSERT, UPDATE, DELETE) against remote Supabase tables.
   * 
   * Note: The Supabase trigger 'tr_handle_note_conflict' evaluates NEW.updated_at vs OLD.updated_at.
   * If an offline collision occurs, the database cancels the UPDATE and automatically generates
   * a ' (Conflicted Copy)' record which PowerSync then streams down to the client.
   */
  async uploadData(database: CommonPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction();
    if (!transaction) return;

    let lastOp: any = null;
    try {
      for (const op of transaction.crud) {
        lastOp = op;
        const table = op.table;

        if (op.op === UpdateType.PUT) {
          const record = { ...op.opData, id: op.id };
          const { error } = await (supabase.from(table as any) as any).upsert(record);
          if (error) {
            throw new Error(`Could not upsert row in ${table} (id: ${op.id}): ${error.message}`);
          }
        } else if (op.op === UpdateType.PATCH) {
          const { error } = await (supabase.from(table as any) as any)
            .update(op.opData)
            .eq('id', op.id);
          if (error) {
            throw new Error(`Could not patch row in ${table} (id: ${op.id}): ${error.message}`);
          }
        } else if (op.op === UpdateType.DELETE) {
          const { error } = await (supabase.from(table as any) as any)
            .delete()
            .eq('id', op.id);
          if (error) {
            throw new Error(`Could not delete row in ${table} (id: ${op.id}): ${error.message}`);
          }
        }
      }

      // Mark local transaction batch as successfully uploaded to clear the queue
      await transaction.complete();
    } catch (error: any) {
      console.error('[Syncron PowerSync Connector] uploadData error during transaction execution:', error, lastOp);
      throw error;
    }
  }
}

export const connector = new SupabaseConnector();
