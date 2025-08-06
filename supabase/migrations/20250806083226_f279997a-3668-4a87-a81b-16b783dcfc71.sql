-- Fix tenant_status enum to include checked_out
ALTER TYPE tenant_status ADD VALUE IF NOT EXISTS 'checked_out';

-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_month DATE NOT NULL, -- First day of the month being paid for
  rent_amount NUMERIC NOT NULL,
  deposit_amount NUMERIC DEFAULT 0,
  other_charges NUMERIC DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'UPI', 'Bank Transfer', 'Other')),
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payments
CREATE POLICY "Owners can manage their payments"
ON public.payments
FOR ALL
USING (auth.uid() = owner_id);

CREATE POLICY "Tenants can view their payments"
ON public.payments
FOR SELECT
USING (
  auth.uid() = owner_id OR 
  tenant_id IN (
    SELECT id FROM tenants WHERE user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();