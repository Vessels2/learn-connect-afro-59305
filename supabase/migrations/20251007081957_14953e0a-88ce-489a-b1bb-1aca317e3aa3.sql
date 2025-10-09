-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');

-- Create enum for grade levels
CREATE TYPE grade_level AS ENUM ('primary', 'secondary', 'university');

-- Create enum for languages
CREATE TYPE language_code AS ENUM ('en', 'ha', 'ig', 'yo', 'pcm');

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  grade_level grade_level,
  preferred_language language_code DEFAULT 'en',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teacher profiles with qualifications
CREATE TABLE teacher_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  qualifications TEXT,
  rank TEXT,
  bio TEXT,
  github_link TEXT,
  twitter_link TEXT,
  facebook_link TEXT,
  other_links TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  grade_level grade_level NOT NULL,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content JSONB,
  language language_code DEFAULT 'en',
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcements table
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_role user_role,
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignments table
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  github_link TEXT,
  max_score INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submissions table
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  github_link TEXT,
  content TEXT,
  score INTEGER,
  feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  graded_at TIMESTAMPTZ,
  UNIQUE(assignment_id, student_id)
);

-- Progress tracking table
CREATE TABLE student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  completed_lessons INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- Enrollments table
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for teacher_profiles
CREATE POLICY "Anyone can view teacher profiles" ON teacher_profiles FOR SELECT USING (true);
CREATE POLICY "Teachers can update own profile" ON teacher_profiles FOR UPDATE 
  USING (auth.uid() = user_id);
CREATE POLICY "Teachers can insert own profile" ON teacher_profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for courses
CREATE POLICY "Anyone can view published courses" ON courses FOR SELECT USING (is_published = true);
CREATE POLICY "Teachers can manage own courses" ON courses FOR ALL 
  USING (auth.uid() = teacher_id);

-- RLS Policies for announcements
CREATE POLICY "Users can view announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY "Teachers and admins can create announcements" ON announcements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('teacher', 'admin')
    )
  );

-- RLS Policies for assignments
CREATE POLICY "Students can view assignments" ON assignments FOR SELECT USING (true);
CREATE POLICY "Teachers can manage own assignments" ON assignments FOR ALL 
  USING (auth.uid() = teacher_id);

-- RLS Policies for submissions
CREATE POLICY "Students can view own submissions" ON submissions FOR SELECT 
  USING (auth.uid() = student_id);
CREATE POLICY "Students can create own submissions" ON submissions FOR INSERT 
  WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Teachers can view all submissions" ON submissions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('teacher', 'admin')
    )
  );
CREATE POLICY "Teachers can update submissions" ON submissions FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('teacher', 'admin')
    )
  );

-- RLS Policies for student_progress
CREATE POLICY "Students can view own progress" ON student_progress FOR SELECT 
  USING (auth.uid() = student_id);
CREATE POLICY "Students can update own progress" ON student_progress FOR ALL 
  USING (auth.uid() = student_id);
CREATE POLICY "Teachers can view all progress" ON student_progress FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('teacher', 'admin')
    )
  );

-- RLS Policies for enrollments
CREATE POLICY "Students can view own enrollments" ON enrollments FOR SELECT 
  USING (auth.uid() = student_id);
CREATE POLICY "Students can enroll in courses" ON enrollments FOR INSERT 
  WITH CHECK (auth.uid() = student_id);

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teacher_profiles_updated_at BEFORE UPDATE ON teacher_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for announcements
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;