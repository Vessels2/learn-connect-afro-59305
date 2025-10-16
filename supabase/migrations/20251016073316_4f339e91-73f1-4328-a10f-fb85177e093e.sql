-- Drop the existing policy that allows students to view parent communications
DROP POLICY IF EXISTS "Users can view parent communications related to them" ON public.parent_communications;

-- Create a new policy that only allows teachers and admins to view parent communications
CREATE POLICY "Only teachers and admins can view parent communications" 
ON public.parent_communications 
FOR SELECT 
USING (
  (auth.uid() = teacher_id) 
  OR 
  (EXISTS ( 
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'::user_role
  ))
);

-- Ensure the management policy for teachers remains intact (no changes needed, just documenting)
-- Policy "Teachers can manage their communications" already exists and is correct