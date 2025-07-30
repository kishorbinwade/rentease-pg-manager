-- Fix the security definer view by recreating it without SECURITY DEFINER
DROP VIEW IF EXISTS room_availability;

-- Create the view again without SECURITY DEFINER (it's not needed for this view)
CREATE VIEW room_availability AS
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