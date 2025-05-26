export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const aiResponse = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        prompt: `Generate a humorous reason why someone needs coffee right now. 

Requirements:
- Make it IT related
- Keep it stupid simple
- One short sentence only 
- Be humorous and relatable
- No quotes around the response

Generate a unique reason:`
      });

      let reason = "";
      if (aiResponse && aiResponse.response) {
        reason = aiResponse.response
          .trim()
          .replace(/^["']|["']$/g, '')
          .replace(/^\d+\.\s*/, '')
          .replace(/^-\s*/, '');
      }

      return new Response(JSON.stringify({ reason }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate coffee excuse',
          details: error.message 
        }), 
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }
  }
}