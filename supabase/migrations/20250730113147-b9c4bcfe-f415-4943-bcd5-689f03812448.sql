-- Create enum types
CREATE TYPE public.user_role AS ENUM ('admin', 'tenant');
CREATE TYPE public.room_status AS ENUM ('occupied', 'vacant', 'under_maintenance');
CREATE TYPE public.tenant_status AS ENUM ('active', 'notice_period', 'inactive');
CREATE TYPE public.complaint_status AS ENUM ('open', 'in_progress', 'resolved');
CREATE TYPE public.complaint_priority AS ENUM ('low', 'medium', 'high');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'tenant',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rooms table
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_number TEXT NOT NULL,
  room_type TEXT NOT NULL,
  rent_amount DECIMAL(10,2) NOT NULL,
  floor INTEGER,
  status room_status NOT NULL DEFAULT 'vacant',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tenants table
CREATE TABLE public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  id_proof_url TEXT,
  agreement_url TEXT,
  status tenant_status NOT NULL DEFAULT 'active',
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create complaints table
CREATE TABLE public.complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status complaint_status NOT NULL DEFAULT 'open',
  priority complaint_priority NOT NULL DEFAULT 'medium',
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rent_records table
CREATE TABLE public.rent_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rent_records ENABLE ROW LEVEL SECURITY;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('tenant-id-proofs', 'tenant-id-proofs', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('agreements', 'agreements', false);

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for rooms
CREATE POLICY "Owners can manage their rooms" ON public.rooms
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Tenants can view rooms" ON public.rooms
  FOR SELECT USING (
    auth.uid() = owner_id OR 
    public.get_user_role() = 'tenant'
  );

-- RLS Policies for tenants
CREATE POLICY "Owners can manage their tenants" ON public.tenants
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Tenants can view their own data" ON public.tenants
  FOR SELECT USING (
    auth.uid() = owner_id OR 
    auth.uid() = user_id
  );

-- RLS Policies for complaints
CREATE POLICY "Owners can manage complaints" ON public.complaints
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Tenants can create and view their complaints" ON public.complaints
  FOR ALL USING (
    auth.uid() = owner_id OR
    tenant_id IN (SELECT id FROM public.tenants WHERE user_id = auth.uid())
  );

-- RLS Policies for rent_records
CREATE POLICY "Owners can manage rent records" ON public.rent_records
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Tenants can view their rent records" ON public.rent_records
  FOR SELECT USING (
    auth.uid() = owner_id OR
    tenant_id IN (SELECT id FROM public.tenants WHERE user_id = auth.uid())
  );

-- Storage policies for tenant-id-proofs
CREATE POLICY "Owners can upload tenant ID proofs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'tenant-id-proofs' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Owners can view tenant ID proofs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'tenant-id-proofs' AND
    auth.role() = 'authenticated'
  );

-- Storage policies for agreements
CREATE POLICY "Owners can upload agreements" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'agreements' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can view agreements" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'agreements' AND
    auth.role() = 'authenticated'
  );

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rent_records_updated_at
  BEFORE UPDATE ON public.rent_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', 'User'),
    COALESCE((new.raw_user_meta_data ->> 'role')::user_role, 'tenant')
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();