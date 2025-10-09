-- Fix critical security issues

-- 1. Fix function search path for update_updated_at_column using CREATE OR REPLACE
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 2. Fix profiles RLS - users should only see their own profile and teacher profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view own and teacher profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id OR 
  role IN ('teacher', 'admin')
);

-- 3. Fix assignments RLS - only enrolled students can view assignments for their courses
DROP POLICY IF EXISTS "Students can view assignments" ON public.assignments;
CREATE POLICY "Enrolled students can view course assignments" 
ON public.assignments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments 
    WHERE enrollments.student_id = auth.uid() 
    AND enrollments.course_id = assignments.course_id
  ) OR
  auth.uid() = teacher_id OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 4. Add RLS policy for teachers to view enrollments for their courses
CREATE POLICY "Teachers can view enrollments for their courses" 
ON public.enrollments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.courses 
    WHERE courses.id = enrollments.course_id 
    AND courses.teacher_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 5. Add policy for teachers to manage enrollments in their courses
CREATE POLICY "Teachers can manage enrollments for their courses" 
ON public.enrollments 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.courses 
    WHERE courses.id = enrollments.course_id 
    AND courses.teacher_id = auth.uid()
  )
);

-- 6. Create parent_communications table for teacher-parent messaging
CREATE TABLE IF NOT EXISTS public.parent_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES public.profiles(id) NOT NULL,
  student_id uuid REFERENCES public.profiles(id) NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  parent_email text,
  parent_phone text,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

ALTER TABLE public.parent_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage their communications" 
ON public.parent_communications 
FOR ALL
USING (auth.uid() = teacher_id);

-- 7. Create SDG content table for offline educational content
CREATE TABLE IF NOT EXISTS public.sdg_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('water', 'health', 'nutrition', 'environment', 'general')),
  content jsonb NOT NULL,
  language language_code DEFAULT 'en',
  grade_level grade_level NOT NULL,
  is_offline_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.sdg_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view SDG content" 
ON public.sdg_content 
FOR SELECT 
USING (true);

CREATE POLICY "Teachers and admins can manage SDG content" 
ON public.sdg_content 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- Add trigger for SDG content updates
CREATE TRIGGER update_sdg_content_updated_at
BEFORE UPDATE ON public.sdg_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();