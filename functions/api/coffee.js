// functions/api/coffee.js - Simple Cloudflare AI Only

export async function onRequest(context) {
  const { request, env } = context;
  
  // Handle CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use Cloudflare AI (FREE!)
    const aiResponse = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      prompt: `Generate a witty, creative, and specific reason why someone needs coffee right now. 

Requirements:
- Make it IT-engineer related
- Keep it stupid simple
- One sentence only
- Be humorous and relatable
- Make it specific and creative
- No quotes around the response

Generate a unique reason:`
    });

    // Extract and clean the response
    let reason = "";
    if (aiResponse && aiResponse.response) {
      reason = aiResponse.response
        .trim()
        .replace(/^["']|["']$/g, '') // Remove quotes from start/end
        .replace(/^\d+\.\s*/, '')    // Remove numbering like "1. "
        .replace(/^-\s*/, '');       // Remove dashes like "- "
    }

    if (reason) {
      return Response.json({ 
        reason: reason,
        source: "Cloudflare AI (Llama 3.1)",
        timestamp: new Date().toISOString()
      }, { headers: corsHeaders });
    } else {
      throw new Error("No response from AI");
    }

  } catch (error) {
    console.error('Error generating coffee excuse:', error);
    
    // Fallback responses
    const fallbackReasons = [
      "Your brain cells are literally holding tiny protest signs that say 'No coffee, no cognitive function'",
      "The Monday morning energy vampires have drained your soul, and only coffee can resurrect your will to live",
      "Your productivity levels are currently running on dial-up speed - coffee is the broadband upgrade you desperately need",
      "The coffee gods are calling, and it would be extremely rude to send them straight to voicemail",
      "Your neurons are staging a revolt and demanding their caffeine tribute before processing another thought"
    ];

    const randomReason = fallbackReasons[Math.floor(Math.random() * fallbackReasons.length)];
    
    return Response.json({ 
      reason: randomReason,
      source: "Fallback mode",
      note: "AI temporarily unavailable - using backup reasons"
    }, { 
      headers: corsHeaders 
    });
  }
}