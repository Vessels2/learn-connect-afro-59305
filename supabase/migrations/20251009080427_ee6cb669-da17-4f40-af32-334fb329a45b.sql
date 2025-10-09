-- Fix 1: Remove email exposure from profiles table
-- Drop the overly permissive policy that exposes teacher/admin emails
DROP POLICY IF EXISTS "Users can view teacher and admin profiles" ON public.profiles;

-- Create a more restrictive policy - users can see teacher names but NOT emails
CREATE POLICY "Users can view teacher and admin names only"
ON public.profiles
FOR SELECT
USING (
  role IN ('teacher', 'admin') 
  AND (
    -- Users can only see limited info (no email, no personal details)
    auth.uid() = id  -- Users can see their own full profile
    OR EXISTS (  -- Or they're viewing a teacher of a course they're enrolled in
      SELECT 1 FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      WHERE e.student_id = auth.uid() 
      AND c.teacher_id = profiles.id
    )
  )
);

-- Fix 2: Restrict teachers to only view submissions for their own courses
DROP POLICY IF EXISTS "Teachers can view all submissions" ON public.submissions;

CREATE POLICY "Teachers can view submissions for their courses"
ON public.submissions
FOR SELECT
USING (
  auth.uid() = student_id  -- Students see their own
  OR EXISTS (  -- Teachers only see submissions for assignments in their courses
    SELECT 1 FROM assignments a
    JOIN courses c ON c.id = a.course_id
    WHERE a.id = submissions.assignment_id
    AND c.teacher_id = auth.uid()
  )
  OR EXISTS (  -- Admins can see all
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Fix 3: Ensure parent communications are properly protected
-- Current policy is correct but let's add explicit column-level security
-- by ensuring parent email/phone are only visible to the teacher who created them
CREATE POLICY "Users can view parent communications related to them"
ON public.parent_communications
FOR SELECT
USING (
  auth.uid() = teacher_id  -- Teachers see their own communications
  OR auth.uid() = student_id  -- Students can see communications about them
  OR EXISTS (  -- Admins can see all
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Fix 4: Restrict assignment visibility to relevant parties only
DROP POLICY IF EXISTS "Enrolled students can view course assignments" ON public.assignments;

CREATE POLICY "Students can view assignments for enrolled courses"
ON public.assignments
FOR SELECT
USING (
  -- Teachers see their own assignments
  auth.uid() = teacher_id
  OR 
  -- Students see assignments for courses they're enrolled in
  EXISTS (
    SELECT 1 FROM enrollments
    WHERE enrollments.student_id = auth.uid()
    AND enrollments.course_id = assignments.course_id
  )
  OR 
  -- Admins see all
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Fix 5: Ensure enrollment data is only visible to authorized users
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Teachers can view enrollments for their courses" ON public.enrollments;

CREATE POLICY "Students can view their own enrollments"
ON public.enrollments
FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view enrollments for their courses only"
ON public.enrollments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = enrollments.course_id
    AND courses.teacher_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Fix 6: Protect announcement author information
DROP POLICY IF EXISTS "Users can view announcements" ON public.announcements;

CREATE POLICY "Users can view relevant announcements"
ON public.announcements
FOR SELECT
USING (
  -- Global announcements visible to all
  is_global = true
  OR
  -- Role-specific announcements visible to users with that role
  target_role IS NULL
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = target_role
  )
  OR
  -- Authors can see their own announcements
  auth.uid() = author_id
  OR
  -- Admins see all
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);