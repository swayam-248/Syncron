-- ==============================================================================
-- Migration: Conflict Resolution Engine ("Conflicted Copy" Strategy)
-- Description: Executes BEFORE UPDATE on public.notes.
--              If incoming NEW.updated_at < OLD.updated_at, bypasses update and
--              inserts a new "(Conflicted Copy)" record with a fresh UUID.
-- ==============================================================================

-- Enable UUID extension if not already available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function: handle_note_conflict
CREATE OR REPLACE FUNCTION public.handle_note_conflict()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_copy_title text;
  now_ms bigint;
BEGIN
  now_ms := (EXTRACT(EPOCH FROM now()) * 1000)::bigint;

  -- 1. Check for out-of-sync conflict (incoming write has older timestamp than existing row)
  IF NEW.updated_at IS NOT NULL AND OLD.updated_at IS NOT NULL AND NEW.updated_at < OLD.updated_at THEN
    
    -- Format title for the conflicted branch
    IF NEW.title LIKE '% (Conflicted Copy)' THEN
      new_copy_title := NEW.title;
    ELSE
      new_copy_title := COALESCE(NEW.title, 'Untitled Note') || ' (Conflicted Copy)';
    END IF;

    -- 2. Insert incoming changes as a new row (Conflicted Copy)
    -- Generating a new UUID avoids primary key collisions
    -- Note: This INSERT will not re-trigger BEFORE UPDATE triggers, eliminating recursion risk.
    INSERT INTO public.notes (
      id,
      user_id,
      title,
      content,
      created_at,
      updated_at,
      deleted_at,
      icon,
      tags,
      pinned,
      sync_status
    ) VALUES (
      gen_random_uuid()::text,
      NEW.user_id,
      new_copy_title,
      NEW.content,
      COALESCE(NEW.created_at, now_ms),
      NEW.updated_at,
      NEW.deleted_at,
      NEW.icon,
      NEW.tags,
      NEW.pinned,
      'synced'
    );

    -- 3. Return NULL to cancel the update against the existing newer row in the database
    RETURN NULL;
  END IF;

  -- Normal update proceeds (incoming write is newer or equal)
  RETURN NEW;
END;
$$;

-- Attach trigger BEFORE UPDATE on public.notes
DROP TRIGGER IF EXISTS tr_handle_note_conflict ON public.notes;

CREATE TRIGGER tr_handle_note_conflict
BEFORE UPDATE ON public.notes
FOR EACH ROW
EXECUTE FUNCTION public.handle_note_conflict();
