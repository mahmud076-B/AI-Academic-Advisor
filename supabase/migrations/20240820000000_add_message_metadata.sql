-- ==============================================================================
-- STEP 67: ADD METADATA COLUMN TO MESSAGES
-- Enables persisting structured assistant evidence (Campus Brain & Syllabus)
-- ==============================================================================

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;
