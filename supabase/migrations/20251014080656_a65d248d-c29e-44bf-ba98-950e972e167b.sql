-- Create badges table
CREATE TABLE public.badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL,
    points_required INTEGER NOT NULL DEFAULT 0,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student_badges table (earned badges)
CREATE TABLE public.student_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, badge_id)
);

-- Create achievements table
CREATE TABLE public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL,
    requirement_type TEXT NOT NULL,
    requirement_value INTEGER NOT NULL,
    points_reward INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student_achievements table
CREATE TABLE public.student_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress INTEGER DEFAULT 0,
    UNIQUE(student_id, achievement_id)
);

-- Create unlockable_content table
CREATE TABLE public.unlockable_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL,
    level_required INTEGER NOT NULL DEFAULT 1,
    points_required INTEGER NOT NULL DEFAULT 0,
    content_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student_unlocks table
CREATE TABLE public.student_unlocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES public.unlockable_content(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, content_id)
);

-- Add gamification columns to student_progress
ALTER TABLE public.student_progress
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date DATE;

-- Enable RLS on all new tables
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unlockable_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_unlocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for badges (everyone can view)
CREATE POLICY "Anyone can view badges"
ON public.badges
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Teachers and admins can manage badges"
ON public.badges
FOR ALL
TO authenticated
USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('teacher', 'admin')));

-- RLS Policies for student_badges
CREATE POLICY "Students can view their own badges"
ON public.student_badges
FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

CREATE POLICY "Students can view classmates badges"
ON public.student_badges
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM enrollments e1
        JOIN enrollments e2 ON e1.course_id = e2.course_id
        WHERE e1.student_id = auth.uid()
          AND e2.student_id = student_badges.student_id
    )
);

CREATE POLICY "System can insert badges"
ON public.student_badges
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);

-- RLS Policies for achievements
CREATE POLICY "Anyone can view achievements"
ON public.achievements
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Teachers and admins can manage achievements"
ON public.achievements
FOR ALL
TO authenticated
USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('teacher', 'admin')));

-- RLS Policies for student_achievements
CREATE POLICY "Students can view their own achievements"
ON public.student_achievements
FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

CREATE POLICY "Students can view classmates achievements"
ON public.student_achievements
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM enrollments e1
        JOIN enrollments e2 ON e1.course_id = e2.course_id
        WHERE e1.student_id = auth.uid()
          AND e2.student_id = student_achievements.student_id
    )
);

CREATE POLICY "System can manage student achievements"
ON public.student_achievements
FOR ALL
TO authenticated
USING (auth.uid() = student_id);

-- RLS Policies for unlockable_content
CREATE POLICY "Anyone can view unlockable content"
ON public.unlockable_content
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Teachers and admins can manage unlockable content"
ON public.unlockable_content
FOR ALL
TO authenticated
USING (auth.uid() IN (SELECT id FROM profiles WHERE role IN ('teacher', 'admin')));

-- RLS Policies for student_unlocks
CREATE POLICY "Students can view their own unlocks"
ON public.student_unlocks
FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

CREATE POLICY "System can insert unlocks"
ON public.student_unlocks
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);

-- Function to award points and check for level up
CREATE OR REPLACE FUNCTION public.award_points(
    _student_id UUID,
    _points INTEGER,
    _course_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _current_points INTEGER;
    _current_level INTEGER;
    _new_level INTEGER;
    _result JSONB;
BEGIN
    SELECT points, level INTO _current_points, _current_level
    FROM student_progress
    WHERE student_id = _student_id AND course_id = _course_id;

    IF NOT FOUND THEN
        INSERT INTO student_progress (student_id, course_id, points, level)
        VALUES (_student_id, _course_id, _points, 1)
        RETURNING points, level INTO _current_points, _current_level;
    ELSE
        UPDATE student_progress
        SET points = points + _points,
            last_activity_date = CURRENT_DATE
        WHERE student_id = _student_id AND course_id = _course_id
        RETURNING points, level INTO _current_points, _current_level;
    END IF;

    _new_level := FLOOR(_current_points / 100) + 1;

    IF _new_level > _current_level THEN
        UPDATE student_progress
        SET level = _new_level
        WHERE student_id = _student_id AND course_id = _course_id;
    END IF;

    _result := jsonb_build_object(
        'points_awarded', _points,
        'total_points', _current_points,
        'previous_level', _current_level,
        'new_level', _new_level,
        'leveled_up', _new_level > _current_level
    );

    RETURN _result;
END;
$$;

-- Function to update streak
CREATE OR REPLACE FUNCTION public.update_streak(_student_id UUID, _course_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _last_activity DATE;
    _current_streak INTEGER;
    _longest_streak INTEGER;
BEGIN
    SELECT last_activity_date, current_streak, longest_streak
    INTO _last_activity, _current_streak, _longest_streak
    FROM student_progress
    WHERE student_id = _student_id AND course_id = _course_id;

    IF NOT FOUND THEN
        INSERT INTO student_progress (student_id, course_id, current_streak, longest_streak, last_activity_date)
        VALUES (_student_id, _course_id, 1, 1, CURRENT_DATE);
    ELSIF _last_activity = CURRENT_DATE - INTERVAL '1 day' THEN
        _current_streak := _current_streak + 1;
        _longest_streak := GREATEST(_longest_streak, _current_streak);
        
        UPDATE student_progress
        SET current_streak = _current_streak,
            longest_streak = _longest_streak,
            last_activity_date = CURRENT_DATE
        WHERE student_id = _student_id AND course_id = _course_id;
    ELSIF _last_activity < CURRENT_DATE - INTERVAL '1 day' THEN
        UPDATE student_progress
        SET current_streak = 1,
            last_activity_date = CURRENT_DATE
        WHERE student_id = _student_id AND course_id = _course_id;
    END IF;
END;
$$;

-- Insert default badges
INSERT INTO public.badges (name, description, icon, points_required, category) VALUES
('First Steps', 'Complete your first assignment', 'Trophy', 0, 'milestone'),
('Rising Star', 'Earn 100 points', 'Star', 100, 'points'),
('Dedicated Learner', 'Maintain a 7-day streak', 'Flame', 0, 'streak'),
('Assignment Master', 'Complete 10 assignments', 'Award', 0, 'completion'),
('Top Performer', 'Reach level 5', 'Crown', 500, 'level'),
('Knowledge Seeker', 'Enroll in 5 courses', 'BookOpen', 0, 'exploration'),
('Perfect Score', 'Get 100% on an assignment', 'Target', 0, 'achievement'),
('Early Bird', 'Submit 3 assignments early', 'Sun', 0, 'timeliness');

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, requirement_type, requirement_value, points_reward) VALUES
('Newcomer', 'Complete your first assignment', 'CheckCircle', 'assignments_completed', 1, 10),
('Consistent', 'Maintain a 3-day learning streak', 'Calendar', 'streak_days', 3, 20),
('Dedicated', 'Maintain a 7-day learning streak', 'Flame', 'streak_days', 7, 50),
('Unstoppable', 'Maintain a 30-day learning streak', 'Zap', 'streak_days', 30, 200),
('Completionist', 'Complete 5 assignments', 'ListChecks', 'assignments_completed', 5, 50),
('Scholar', 'Complete 20 assignments', 'GraduationCap', 'assignments_completed', 20, 150),
('Rising Star', 'Earn 500 points', 'Star', 'points_earned', 500, 100),
('Elite Learner', 'Earn 1000 points', 'Award', 'points_earned', 1000, 250);

-- Create indexes
CREATE INDEX idx_student_badges_student ON public.student_badges(student_id);
CREATE INDEX idx_student_badges_badge ON public.student_badges(badge_id);
CREATE INDEX idx_student_achievements_student ON public.student_achievements(student_id);
CREATE INDEX idx_student_unlocks_student ON public.student_unlocks(student_id);
CREATE INDEX idx_student_progress_points ON public.student_progress(points DESC);
CREATE INDEX idx_student_progress_level ON public.student_progress(level DESC);