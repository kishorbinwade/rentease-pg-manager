-- Remove SECURITY DEFINER from the function we just created and fix search path
DROP FUNCTION IF EXISTS public.validate_file_upload(TEXT, BIGINT, TEXT);

-- Recreate the function with proper security settings
CREATE OR REPLACE FUNCTION public.validate_file_upload(
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
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
$$;

-- Update RLS policies to require authentication (fix anonymous access)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Update other critical policies to require authentication
DROP POLICY IF EXISTS "Tenants can view their own data" ON public.tenants;
CREATE POLICY "Authenticated tenants can view their own data" 
ON public.tenants 
FOR SELECT 
TO authenticated
USING ((auth.uid() = owner_id) OR (auth.uid() = user_id));