
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Teachers can view enrolled students" ON profiles;
DROP POLICY IF EXISTS "Users can view teacher and admin names only" ON profiles;
DROP POLICY IF EXISTS "Teachers can manage enrollments for their courses" ON enrollments;
DROP POLICY IF EXISTS "Teachers can view enrollments for their courses only" ON enrollments;

-- Create a security definer function to check user role without RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Recreate profiles policies without recursion
CREATE POLICY "Teachers can view enrolled students"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM courses c
    JOIN enrollments e ON e.course_id = c.id
    WHERE c.teacher_id = auth.uid() AND e.student_id = profiles.id
  )
);

CREATE POLICY "Users can view teacher and admin profiles"
ON profiles FOR SELECT
USING (
  role IN ('teacher', 'admin') 
  AND (
    auth.uid() = id 
    OR EXISTS (
      SELECT 1 FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      WHERE e.student_id = auth.uid() AND c.teacher_id = profiles.id
    )
  )
);

-- Recreate enrollments policies without recursion
CREATE POLICY "Teachers can manage enrollments for their courses"
ON enrollments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = enrollments.course_id AND courses.teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can view enrollments for their courses"
ON enrollments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = enrollments.course_id AND courses.teacher_id = auth.uid()
  )
  OR public.get_user_role(auth.uid()) = 'admin'
);
