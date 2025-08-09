-- Create tariff_config table for easy updates
CREATE TABLE public.tariff_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  state_name text NOT NULL DEFAULT 'Maharashtra',
  slab_from integer NOT NULL,
  slab_to integer,
  rate_per_unit numeric(10,2) NOT NULL,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert Maharashtra residential tariff rates
INSERT INTO public.tariff_config (slab_from, slab_to, rate_per_unit) VALUES
(0, 100, 3.44),
(101, 300, 7.34),
(301, NULL, 10.36);

-- Create meters table (one-to-one with rooms)
CREATE TABLE public.meters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meter_id text NOT NULL UNIQUE,
  room_id uuid NOT NULL UNIQUE,
  owner_id uuid NOT NULL,
  starting_reading numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE
);

-- Create meter_readings table
CREATE TABLE public.meter_readings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meter_id uuid NOT NULL,
  reading_value numeric(10,2) NOT NULL,
  reading_date date NOT NULL,
  units_consumed numeric(10,2) NOT NULL DEFAULT 0,
  bill_amount numeric(10,2) NOT NULL DEFAULT 0,
  recorded_by uuid NOT NULL,
  recorded_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  FOREIGN KEY (meter_id) REFERENCES public.meters(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.tariff_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meter_readings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tariff_config (read-only for authenticated users)
CREATE POLICY "Anyone can view tariff config" 
ON public.tariff_config FOR SELECT 
USING (true);

-- RLS Policies for meters
CREATE POLICY "Owners can manage their meters" 
ON public.meters FOR ALL 
USING (auth.uid() = owner_id);

CREATE POLICY "Tenants can view meters in their rooms" 
ON public.meters FOR SELECT 
USING (
  auth.uid() = owner_id OR 
  room_id IN (
    SELECT room_id FROM tenants WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- RLS Policies for meter_readings
CREATE POLICY "Owners can manage their meter readings" 
ON public.meter_readings FOR ALL 
USING (
  meter_id IN (
    SELECT id FROM meters WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Tenants can view their meter readings" 
ON public.meter_readings FOR SELECT 
USING (
  meter_id IN (
    SELECT m.id FROM meters m 
    JOIN tenants t ON m.room_id = t.room_id 
    WHERE t.user_id = auth.uid() AND t.status = 'active'
  ) OR
  meter_id IN (
    SELECT id FROM meters WHERE owner_id = auth.uid()
  )
);

-- Create function to calculate electricity bill
CREATE OR REPLACE FUNCTION public.calculate_electricity_bill(units_consumed numeric)
RETURNS numeric
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  total_bill numeric := 0;
  remaining_units numeric := units_consumed;
  slab_rate numeric;
  slab_units numeric;
BEGIN
  -- Apply tariff slabs
  FOR slab_rate, slab_units IN 
    SELECT rate_per_unit, 
           CASE 
             WHEN slab_to IS NULL THEN remaining_units
             ELSE LEAST(remaining_units, slab_to - slab_from + 1)
           END as units_in_slab
    FROM tariff_config 
    WHERE is_active = true 
      AND slab_from <= units_consumed
    ORDER BY slab_from
  LOOP
    IF remaining_units <= 0 THEN EXIT; END IF;
    total_bill := total_bill + (slab_units * slab_rate);
    remaining_units := remaining_units - slab_units;
  END LOOP;
  
  RETURN ROUND(total_bill, 2);
END;
$$;

-- Create triggers for timestamp updates
CREATE TRIGGER update_tariff_config_updated_at
  BEFORE UPDATE ON public.tariff_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meters_updated_at
  BEFORE UPDATE ON public.meters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meter_readings_updated_at
  BEFORE UPDATE ON public.meter_readings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_meters_room_id ON public.meters(room_id);
CREATE INDEX idx_meters_owner_id ON public.meters(owner_id);
CREATE INDEX idx_meter_readings_meter_id ON public.meter_readings(meter_id);
CREATE INDEX idx_meter_readings_date ON public.meter_readings(reading_date);
CREATE INDEX idx_tariff_config_active ON public.tariff_config(is_active);