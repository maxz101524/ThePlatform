-- Auto-create a profile row when a new auth user signs up.
-- Reads username and opl_name from user metadata passed during signUp().
-- SECURITY DEFINER bypasses RLS so this works before the session is active.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, opl_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NULLIF(NEW.raw_user_meta_data->>'opl_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
