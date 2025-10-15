-- Create assessment types enum
CREATE TYPE assessment_type AS ENUM ('quiz', 'code_challenge', 'practice', 'graded');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'code_challenge', 'short_answer', 'essay');

-- Assessments table
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assessment_type assessment_type NOT NULL,
  max_score INTEGER DEFAULT 100,
  time_limit_minutes INTEGER,
  due_date TIMESTAMP WITH TIME ZONE,
  allow_peer_review BOOLEAN DEFAULT false,
  peer_review_required INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Assessment questions
CREATE TABLE assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_type question_type NOT NULL,
  question_text TEXT NOT NULL,
  code_template TEXT,
  test_cases JSONB,
  points INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Multiple choice options
CREATE TABLE assessment_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Assessment submissions
CREATE TABLE assessment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  score INTEGER,
  auto_graded_score INTEGER,
  manual_score INTEGER,
  feedback TEXT,
  time_taken_minutes INTEGER,
  is_practice BOOLEAN DEFAULT false,
  UNIQUE(assessment_id, student_id)
);

-- Student answers
CREATE TABLE assessment_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES assessment_submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  selected_option_id UUID REFERENCES assessment_options(id),
  code_answer TEXT,
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  auto_graded BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Rubrics
CREATE TABLE rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Rubric criteria
CREATE TABLE rubric_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_id UUID NOT NULL REFERENCES rubrics(id) ON DELETE CASCADE,
  criterion_name TEXT NOT NULL,
  description TEXT,
  max_points INTEGER NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Assessment rubrics link
CREATE TABLE assessment_rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  rubric_id UUID NOT NULL REFERENCES rubrics(id) ON DELETE CASCADE,
  UNIQUE(assessment_id, rubric_id)
);

-- Peer reviews
CREATE TABLE peer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES assessment_submissions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER,
  feedback TEXT,
  rubric_scores JSONB,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(submission_id, reviewer_id)
);

-- Enable RLS
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubric_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assessments
CREATE POLICY "Teachers can manage own assessments" ON assessments
  FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view published assessments for enrolled courses" ON assessments
  FOR SELECT USING (
    is_published = true AND EXISTS (
      SELECT 1 FROM enrollments 
      WHERE enrollments.student_id = auth.uid() 
      AND enrollments.course_id = assessments.course_id
    )
  );

-- RLS Policies for assessment_questions
CREATE POLICY "Teachers can manage questions for own assessments" ON assessment_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM assessments 
      WHERE assessments.id = assessment_questions.assessment_id 
      AND assessments.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view questions for published assessments" ON assessment_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assessments a
      JOIN enrollments e ON e.course_id = a.course_id
      WHERE a.id = assessment_questions.assessment_id 
      AND a.is_published = true
      AND e.student_id = auth.uid()
    )
  );

-- RLS Policies for assessment_options
CREATE POLICY "Teachers can manage options" ON assessment_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM assessment_questions q
      JOIN assessments a ON a.id = q.assessment_id
      WHERE q.id = assessment_options.question_id 
      AND a.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view options" ON assessment_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assessment_questions q
      JOIN assessments a ON a.id = q.assessment_id
      JOIN enrollments e ON e.course_id = a.course_id
      WHERE q.id = assessment_options.question_id 
      AND a.is_published = true
      AND e.student_id = auth.uid()
    )
  );

-- RLS Policies for assessment_submissions
CREATE POLICY "Students can manage own submissions" ON assessment_submissions
  FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view submissions for their assessments" ON assessment_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assessments 
      WHERE assessments.id = assessment_submissions.assessment_id 
      AND assessments.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update submissions for grading" ON assessment_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM assessments 
      WHERE assessments.id = assessment_submissions.assessment_id 
      AND assessments.teacher_id = auth.uid()
    )
  );

-- RLS Policies for assessment_answers
CREATE POLICY "Students can manage own answers" ON assessment_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM assessment_submissions 
      WHERE assessment_submissions.id = assessment_answers.submission_id 
      AND assessment_submissions.student_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view answers for their assessments" ON assessment_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assessment_submissions s
      JOIN assessments a ON a.id = s.assessment_id
      WHERE s.id = assessment_answers.submission_id 
      AND a.teacher_id = auth.uid()
    )
  );

-- RLS Policies for rubrics
CREATE POLICY "Teachers can manage own rubrics" ON rubrics
  FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view rubrics for their assessments" ON rubrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assessment_rubrics ar
      JOIN assessments a ON a.id = ar.assessment_id
      JOIN enrollments e ON e.course_id = a.course_id
      WHERE ar.rubric_id = rubrics.id
      AND e.student_id = auth.uid()
    )
  );

-- RLS Policies for rubric_criteria
CREATE POLICY "Teachers can manage criteria for own rubrics" ON rubric_criteria
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM rubrics 
      WHERE rubrics.id = rubric_criteria.rubric_id 
      AND rubrics.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view criteria" ON rubric_criteria
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rubrics r
      JOIN assessment_rubrics ar ON ar.rubric_id = r.id
      JOIN assessments a ON a.id = ar.assessment_id
      JOIN enrollments e ON e.course_id = a.course_id
      WHERE r.id = rubric_criteria.rubric_id
      AND e.student_id = auth.uid()
    )
  );

-- RLS Policies for assessment_rubrics
CREATE POLICY "Teachers can manage assessment rubrics" ON assessment_rubrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM assessments 
      WHERE assessments.id = assessment_rubrics.assessment_id 
      AND assessments.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view assessment rubrics" ON assessment_rubrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assessments a
      JOIN enrollments e ON e.course_id = a.course_id
      WHERE a.id = assessment_rubrics.assessment_id
      AND e.student_id = auth.uid()
    )
  );

-- RLS Policies for peer_reviews
CREATE POLICY "Students can manage own peer reviews" ON peer_reviews
  FOR ALL USING (auth.uid() = reviewer_id);

CREATE POLICY "Students can view peer reviews of their submissions" ON peer_reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assessment_submissions 
      WHERE assessment_submissions.id = peer_reviews.submission_id 
      AND assessment_submissions.student_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view all peer reviews for their assessments" ON peer_reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assessment_submissions s
      JOIN assessments a ON a.id = s.assessment_id
      WHERE s.id = peer_reviews.submission_id 
      AND a.teacher_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_assessments_course ON assessments(course_id);
CREATE INDEX idx_assessments_teacher ON assessments(teacher_id);
CREATE INDEX idx_assessment_questions_assessment ON assessment_questions(assessment_id);
CREATE INDEX idx_assessment_options_question ON assessment_options(question_id);
CREATE INDEX idx_assessment_submissions_assessment ON assessment_submissions(assessment_id);
CREATE INDEX idx_assessment_submissions_student ON assessment_submissions(student_id);
CREATE INDEX idx_assessment_answers_submission ON assessment_answers(submission_id);
CREATE INDEX idx_peer_reviews_submission ON peer_reviews(submission_id);
CREATE INDEX idx_peer_reviews_reviewer ON peer_reviews(reviewer_id);

-- Function to auto-grade multiple choice questions
CREATE OR REPLACE FUNCTION auto_grade_submission(p_submission_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_score INTEGER := 0;
  v_answer RECORD;
BEGIN
  FOR v_answer IN 
    SELECT 
      aa.id,
      aa.question_id,
      aa.selected_option_id,
      aq.points,
      ao.is_correct
    FROM assessment_answers aa
    JOIN assessment_questions aq ON aq.id = aa.question_id
    LEFT JOIN assessment_options ao ON ao.id = aa.selected_option_id
    WHERE aa.submission_id = p_submission_id
    AND aq.question_type = 'multiple_choice'
  LOOP
    IF v_answer.is_correct THEN
      UPDATE assessment_answers
      SET 
        is_correct = true,
        points_earned = v_answer.points,
        auto_graded = true
      WHERE id = v_answer.id;
      
      v_total_score := v_total_score + v_answer.points;
    ELSE
      UPDATE assessment_answers
      SET 
        is_correct = false,
        points_earned = 0,
        auto_graded = true
      WHERE id = v_answer.id;
    END IF;
  END LOOP;

  UPDATE assessment_submissions
  SET 
    auto_graded_score = v_total_score,
    score = v_total_score
  WHERE id = p_submission_id;
END;
$$;