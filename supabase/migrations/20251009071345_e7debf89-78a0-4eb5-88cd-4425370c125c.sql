-- Allow teachers to delete announcements they created
CREATE POLICY "Teachers can delete own announcements"
ON public.announcements
FOR DELETE
USING (auth.uid() = author_id);

-- Allow students to delete announcements (after viewing)
CREATE POLICY "Students can delete announcements"
ON public.announcements
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'student'
  )
);

-- Update profiles RLS to allow teachers to see emails of students in their courses
DROP POLICY IF EXISTS "Users can view own and teacher profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can view teacher and admin profiles"
ON public.profiles
FOR SELECT
USING (role = ANY (ARRAY['teacher'::user_role, 'admin'::user_role]));

CREATE POLICY "Teachers can view enrolled students"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM courses c
    JOIN enrollments e ON e.course_id = c.id
    WHERE c.teacher_id = auth.uid()
    AND e.student_id = profiles.id
  )
);

-- Add auto-delete timestamp column to assignments if not exists
ALTER TABLE public.assignments
ADD COLUMN IF NOT EXISTS auto_delete_at timestamp with time zone;

-- Create function to auto-delete old assignments
CREATE OR REPLACE FUNCTION public.delete_old_assignments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.assignments
  WHERE auto_delete_at IS NOT NULL
  AND auto_delete_at < NOW();
END;
$$;

-- Update assignments to set auto_delete_at to 24 hours after creation
CREATE OR REPLACE FUNCTION public.set_assignment_auto_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.auto_delete_at = NEW.created_at + INTERVAL '24 hours';
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_assignment_auto_delete_trigger
BEFORE INSERT ON public.assignments
FOR EACH ROW
EXECUTE FUNCTION public.set_assignment_auto_delete();