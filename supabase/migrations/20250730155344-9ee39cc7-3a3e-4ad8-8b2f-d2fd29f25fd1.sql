-- Add capacity field to rooms table
ALTER TABLE public.rooms ADD COLUMN capacity INTEGER NOT NULL DEFAULT 1;

-- Update existing rooms based on room_type
UPDATE public.rooms 
SET capacity = CASE 
  WHEN LOWER(room_type) LIKE '%double%' OR LOWER(room_type) LIKE '%sharing%' AND LOWER(room_type) LIKE '%2%' THEN 2
  WHEN LOWER(room_type) LIKE '%triple%' OR LOWER(room_type) LIKE '%3%' THEN 3
  ELSE 1
END;

-- Create a view for room availability with occupancy calculation
CREATE OR REPLACE VIEW room_availability AS
SELECT 
  r.*,
  COALESCE(t.current_occupancy, 0) as current_occupancy,
  (r.capacity - COALESCE(t.current_occupancy, 0)) as available_beds
FROM rooms r
LEFT JOIN (
  SELECT 
    room_id, 
    COUNT(*) as current_occupancy 
  FROM tenants 
  WHERE status = 'active' 
  GROUP BY room_id
) t ON r.id = t.room_id
WHERE r.capacity > COALESCE(t.current_occupancy, 0);