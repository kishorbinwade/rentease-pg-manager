-- Fix the handle_new_user function with explicit schema references
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', 'User'),
    COALESCE((new.raw_user_meta_data ->> 'role')::public.user_role, 'tenant'::public.user_role)
  );
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RAISE;
END;
$$;