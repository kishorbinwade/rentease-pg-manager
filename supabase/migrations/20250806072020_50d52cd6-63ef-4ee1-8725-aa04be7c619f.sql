-- Add check-in and check-out fields to tenants table
ALTER TABLE public.tenants 
ADD COLUMN check_in_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN check_out_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN checked_out_by UUID REFERENCES auth.users(id);

-- Create room edit history table
CREATE TABLE public.room_edit_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  edited_by UUID NOT NULL,
  edited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on room_edit_history
ALTER TABLE public.room_edit_history ENABLE ROW LEVEL SECURITY;

-- Create policy for room edit history
CREATE POLICY "Owners can view their room edit history" 
ON public.room_edit_history 
FOR ALL 
USING (
  room_id IN (
    SELECT id FROM rooms WHERE owner_id = auth.uid()
  )
);

-- Add trigger for room edit history timestamps
CREATE TRIGGER update_room_edit_history_updated_at
BEFORE UPDATE ON public.room_edit_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update existing tenants to have check_in_date as their join_date
UPDATE public.tenants 
SET check_in_date = (join_date || ' 00:00:00')::timestamp with time zone 
WHERE check_in_date IS NULL;