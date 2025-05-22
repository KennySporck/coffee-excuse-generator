// functions/api/coffee.js - Cloudflare Pages Function

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
    // Option 1: Use Cloudflare AI (FREE and built-in!)
    if (env.AI) {
      const aiResponse = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        prompt: "Generate a witty, creative, and specific reason why someone needs coffee right now. One sentence only. Be humorous and relatable. Examples: 'Your brain cells are holding tiny protest signs demanding caffeine before they'll process another thought' or 'The Monday energy vampires have drained your soul and only coffee can resurrect your productivity.' Give me just the reason, no extra text."
      });

      // Extract the response text from Cloudflare AI
      let reason = "";
      if (aiResponse && aiResponse.response) {
        reason = aiResponse.response.trim().replace(/['"]/g, '');
      }

      if (reason) {
        return Response.json({ 
          reason: reason,
          source: "Cloudflare AI (Llama 3.1)"
        }, { headers: corsHeaders });
      }
    }

    // Option 2: Use Groq (Free tier - backup)
    if (env.GROQ_API_KEY) {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [{
            role: "user",
            content: "Generate a witty, creative, and specific reason why someone needs coffee right now. One sentence only. Be humorous and relatable."
          }],
          max_tokens: 100,
          temperature: 0.9
        })
      });

      const data = await response.json();
      
      if (data.choices && data.choices[0]) {
        return Response.json({ 
          reason: data.choices[0].message.content.trim().replace(/['"]/g, ''),
          source: "Groq API"
        }, { headers: corsHeaders });
      }
    }

    // Option 3: Use Claude Haiku (very cheap - backup)
    if (env.ANTHROPIC_API_KEY) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': env.ANTHROPIC_API_KEY,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 100,
          messages: [{
            role: "user",
            content: "Generate a witty, creative, and specific reason why someone needs coffee right now. One sentence only. Be humorous and relatable."
          }]
        })
      });

      const data = await response.json();
      
      if (data.content && data.content[0]) {
        return Response.json({ 
          reason: data.content[0].text.trim().replace(/['"]/g, ''),
          source: "Claude Haiku"
        }, { headers: corsHeaders });
      }
    }

    // Fallback: Pre-written responses if no AI is available
    const fallbackReasons = [
      "Your brain cells are literally holding tiny protest signs that say 'No coffee, no cognitive function.'",
      "The Monday morning energy vampires have drained your soul, and only coffee can resurrect your will to live.",
      "Your productivity levels are currently running on dial-up speed - coffee is the broadband upgrade you desperately need.",
      "The coffee gods are calling, and it would be extremely rude to send them straight to voicemail.",
      "Your neurons are staging a revolt and demanding their caffeine tribute before processing another thought.",
      "The universe has conspired to make coffee the only thing standing between you and becoming a workplace zombie.",
      "Your morning routine is incomplete without the sacred ritual of bean juice consumption - it's basically a spiritual emergency.",
      "Your DNA is 60% water, 30% stardust, and 10% coffee dependency - time to honor that genetic requirement.",
      "Your energy meter is blinking red like a low battery warning, and coffee is the only compatible charger.",
      "The voices in your head are actually just your brain cells collectively begging for their daily caffeine fix.",
      "Your motivation packed its bags and left a note saying it'll only return after you've had proper coffee.",
      "The Laws of Physics clearly state that humans cannot function properly before their first cup of coffee.",
      "Your inner creative genius is being held hostage by caffeine withdrawal and demands immediate ransom payment.",
      "The coffee bean spirits are whispering sweet motivational secrets that only a proper brew can unlock.",
      "Your willpower is running on empty, and coffee is the premium fuel it needs to get back on the road."
    ];

    const randomReason = fallbackReasons[Math.floor(Math.random() * fallbackReasons.length)];
    
    return Response.json({ 
      reason: randomReason,
      source: "Fallback mode",
      note: "💡 Tip: Enable Cloudflare AI for unlimited AI-generated reasons!"
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error generating coffee excuse:', error);
    
    return Response.json({ 
      error: "The coffee machine is temporarily broken. Please try again in a moment!" 
    }, { 
      status: 500,
      headers: corsHeaders 
    });
  }
}