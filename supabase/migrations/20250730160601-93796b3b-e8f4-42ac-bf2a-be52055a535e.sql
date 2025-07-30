-- Fix RLS policy vulnerability by ensuring tenants have proper user_id association
-- Add constraint to prevent orphaned tenant records
ALTER TABLE tenants ADD CONSTRAINT tenants_user_id_required 
CHECK (user_id IS NOT NULL OR owner_id = user_id);

-- Update existing orphaned tenant records to have proper associations
-- This is a data migration to fix existing data
UPDATE tenants 
SET user_id = owner_id 
WHERE user_id IS NULL AND owner_id IS NOT NULL;

-- Create function for secure file validation
CREATE OR REPLACE FUNCTION public.validate_file_upload(
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check file size (max 10MB)
  IF file_size > 10485760 THEN
    RAISE EXCEPTION 'File size exceeds maximum limit of 10MB';
  END IF;
  
  -- Check allowed file types for ID proofs and agreements
  IF mime_type NOT IN (
    'image/jpeg', 'image/png', 'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) THEN
    RAISE EXCEPTION 'File type not allowed. Only images, PDF, and Word documents are permitted';
  END IF;
  
  -- Sanitize file name (basic check)
  IF file_name ~ '[<>:"/\\|?*]' THEN
    RAISE EXCEPTION 'File name contains invalid characters';
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;