import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get student's courses and progress
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select(`
        course_id,
        courses (
          title,
          description
        )
      `)
      .eq('student_id', studentId);

    if (enrollError) throw enrollError;

    // Get student's recent submissions
    const { data: submissions, error: subError } = await supabase
      .from('submissions')
      .select(`
        grade,
        assignments (
          title,
          course_id
        )
      `)
      .eq('student_id', studentId)
      .order('submitted_at', { ascending: false })
      .limit(10);

    if (subError) throw subError;

    // Get student progress
    const { data: progress, error: progError } = await supabase
      .from('student_progress')
      .select('*')
      .eq('student_id', studentId);

    if (progError) throw progError;

    const prompt = `Based on the following student data, provide personalized study recommendations:

Enrolled Courses: ${JSON.stringify(enrollments)}
Recent Submissions: ${JSON.stringify(submissions)}
Progress Data: ${JSON.stringify(progress)}

Please provide:
1. Areas that need improvement
2. Specific study recommendations for each course
3. Time management suggestions
4. Upcoming topics to focus on
5. Strengths to leverage

Format as a clear, actionable study plan.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an experienced educational advisor who provides personalized, actionable study recommendations. Be encouraging and specific."
          },
          {
            role: "user",
            content: prompt
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const recommendations = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ recommendations }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in study-recommendations:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
