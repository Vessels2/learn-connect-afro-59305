-- Create activity log table for detailed tracking
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
  duration_minutes INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies for activity_logs
CREATE POLICY "Users can insert own activity"
ON public.activity_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own activity"
ON public.activity_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view student activity for their courses"
ON public.activity_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = activity_logs.course_id AND c.teacher_id = auth.uid()
  )
  OR public.get_user_role(auth.uid()) = 'admin'
);

-- Add skills tracking to student_progress
ALTER TABLE public.student_progress 
ADD COLUMN IF NOT EXISTS skills_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS time_spent_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completion_rate DECIMAL(5,2) DEFAULT 0.00;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_course_id ON public.activity_logs(course_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);