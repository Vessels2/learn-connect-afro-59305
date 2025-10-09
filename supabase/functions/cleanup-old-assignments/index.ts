import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Delete assignments where auto_delete_at is in the past
    const { data, error } = await supabase
      .from('assignments')
      .delete()
      .lt('auto_delete_at', new Date().toISOString())
      .not('auto_delete_at', 'is', null)
      .select();

    if (error) throw error;

    console.log(`Deleted ${data?.length || 0} old assignments`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        deletedCount: data?.length || 0,
        message: `Deleted ${data?.length || 0} assignments that exceeded 24 hours`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error cleaning up assignments:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});