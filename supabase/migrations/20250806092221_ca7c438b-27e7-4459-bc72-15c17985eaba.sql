-- Add deposit amount column to tenants table for check-in deposits
ALTER TABLE public.tenants 
ADD COLUMN deposit_amount NUMERIC DEFAULT 0;

-- Add deposit return tracking columns to tenants table for check-out
ALTER TABLE public.tenants 
ADD COLUMN deposit_return_amount NUMERIC DEFAULT 0,
ADD COLUMN deposit_return_status TEXT DEFAULT 'pending';

-- Add comment to clarify the deposit columns
COMMENT ON COLUMN public.tenants.deposit_amount IS 'Initial deposit amount paid at check-in';
COMMENT ON COLUMN public.tenants.deposit_return_amount IS 'Amount returned during check-out';
COMMENT ON COLUMN public.tenants.deposit_return_status IS 'Status of deposit return: pending, full, partial, none';