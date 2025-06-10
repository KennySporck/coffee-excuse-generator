export default {
  async fetch(request, env, ctx) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Client-ID',
      'Access-Control-Max-Age': '86400',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);
    
    if (url.pathname === '/api/coffee') {
      return handleCoffeeRequest(request, env, corsHeaders);
    }

    return new Response('Not Found', { 
      status: 404,
      headers: corsHeaders 
    });
  },
};

async function handleCoffeeRequest(request, env, corsHeaders) {
  try {
    // Get client IP and other identifiers
    const clientIP = request.headers.get('CF-Connecting-IP') || 
                    request.headers.get('X-Forwarded-For') || 
                    'unknown';
    const userAgent = request.headers.get('User-Agent') || '';
    const clientId = request.headers.get('X-Client-ID') || '';
    const country = request.cf?.country || 'unknown';

    console.log(`Request from IP: ${clientIP}, Country: ${country}, Client ID: ${clientId}`);

    // Create multiple rate limiting keys for different scenarios
    const ipKey = `rate_limit:ip:${clientIP}`;
    const countryKey = `rate_limit:country:${country}`;
    const clientKey = `rate_limit:client:${clientId}`;

    // Rate limiting configuration
    const LIMITS = {
      perIP: { requests: 10, window: 60 }, // 10 requests per minute per IP
      perCountry: { requests: 100, window: 60 }, // 100 requests per minute per country
      perClient: { requests: 2, window: 60 }, // 2 requests per minute per client ID
    };

    // Check rate limits
    const rateLimitChecks = [
      { key: ipKey, limit: LIMITS.perIP, name: 'IP' },
      { key: countryKey, limit: LIMITS.perCountry, name: 'Country' },
      { key: clientKey, limit: LIMITS.perClient, name: 'Client' },
    ];

    for (const check of rateLimitChecks) {
      const isLimited = await checkRateLimit(env, check.key, check.limit);
      if (isLimited) {
        console.log(`Rate limit exceeded for ${check.name}: ${check.key}`);
        return new Response(
          JSON.stringify({
            error: `Rate limit exceeded for ${check.name.toLowerCase()}. Please try again later.`,
            retryAfter: check.limit.window
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Retry-After': check.limit.window.toString(),
            },
          }
        );
      }
    }

    // Additional suspicious activity detection
    if (await detectSuspiciousActivity(env, clientIP, userAgent)) {
      console.log(`Suspicious activity detected from IP: ${clientIP}`);
      return new Response(
        JSON.stringify({
          error: 'Suspicious activity detected. Please try again later.',
          retryAfter: 300 // 5 minutes
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': '300',
          },
        }
      );
    }

    // Generate AI-powered coffee excuse
    const excuse = await generateAICoffeeExcuse(env);

    // Log successful request for monitoring
    await logRequest(env, {
      ip: clientIP,
      country: country,
      clientId: clientId,
      userAgent: userAgent,
      timestamp: Date.now(),
    });

    return new Response(
      JSON.stringify({ reason: excuse }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );

  } catch (error) {
    console.error('Error handling coffee request:', error);
    
    // Fallback to static excuse if AI fails
    const fallbackExcuse = getFallbackExcuse();
    
    return new Response(
      JSON.stringify({ 
        reason: fallbackExcuse,
        note: 'AI temporarily unavailable, serving backup excuse'
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

async function generateAICoffeeExcuse(env) {
  try {
    const aiResponse = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      prompt: `Generate a humorous reason why someone needs coffee right now. 

Requirements:
- Make it IT/programming/tech related
- Keep it simple and relatable
- One short sentence only 
- Be humorous and witty
- No quotes around the response
- Make it sound like a legitimate work excuse

Generate a unique reason:`
    });

    let reason = "";
    if (aiResponse && aiResponse.response) {
      reason = aiResponse.response
        .trim()
        .replace(/^["']|["']$/g, '')
        .replace(/^\d+\.\s*/, '')
        .replace(/^-\s*/, '')
        .replace(/^because\s*/i, '')
        .replace(/^i\s+/i, 'I ');
      
      // Ensure it starts with a capital letter
      if (reason && reason.length > 0) {
        reason = reason.charAt(0).toUpperCase() + reason.slice(1);
      }
      
      // Ensure it ends with a period
      if (reason && !reason.endsWith('.') && !reason.endsWith('!') && !reason.endsWith('?')) {
        reason += '.';
      }
    }

    // Fallback if AI response is empty or too short
    if (!reason || reason.length < 10) {
      return getFallbackExcuse();
    }

    return reason;

  } catch (error) {
    console.error('AI generation failed:', error);
    return getFallbackExcuse();
  }
}

function getFallbackExcuse() {
  const fallbackExcuses = [
    "My brain's cache needs to be refreshed with some premium coffee data.",
    "I need coffee to properly compile my thoughts into actionable code.",
    "Coffee is required to prevent my motivation from going into sleep mode.",
    "My productivity API has a mandatory coffee dependency that needs updating.",
    "I need coffee to establish a stable connection with my development environment.",
    "Coffee break is essential for my brain's garbage collection routine to run.",
    "My multithreading capabilities require a caffeine boost to function optimally.",
    "I need coffee to debug this complex problem called 'being awake'.",
    "Coffee is the middleware between my sleepy brain and productive coding.",
    "My neural network needs coffee to prevent it from going offline.",
    "I require coffee to optimize my human-to-computer interface performance.",
    "Coffee is necessary to maintain proper memory allocation in my brain processes.",
    "I need coffee to prevent my concentration from throwing a null pointer exception.",
    "My creativity engine is running low on caffeine fuel and needs a refill.",
    "Coffee helps me maintain optimal uptime for my cognitive processes."
  ];

  return fallbackExcuses[Math.floor(Math.random() * fallbackExcuses.length)];
}

async function checkRateLimit(env, key, { requests, window }) {
  try {
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - window;
    
    // Get current count from KV store
    let rateLimitData = await env.COFFEE_KV?.get(key);
    if (rateLimitData) {
      rateLimitData = JSON.parse(rateLimitData);
    } else {
      rateLimitData = { count: 0, windowStart: now };
    }

    // Reset if we're in a new window
    if (rateLimitData.windowStart < windowStart) {
      rateLimitData = { count: 0, windowStart: now };
    }

    // Check if limit exceeded
    if (rateLimitData.count >= requests) {
      return true; // Rate limited
    }

    // Increment count and store
    rateLimitData.count++;
    await env.COFFEE_KV?.put(
      key, 
      JSON.stringify(rateLimitData), 
      { expirationTtl: window * 2 }
    );

    return false; // Not rate limited
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return false; // Allow request on error
  }
}

async function detectSuspiciousActivity(env, ip, userAgent) {
  try {
    // Check for rapid successive requests from same IP
    const rapidKey = `rapid:${ip}`;
    const rapidData = await env.COFFEE_KV?.get(rapidKey);
    
    if (rapidData) {
      const data = JSON.parse(rapidData);
      const now = Date.now();
      
      // If more than 5 requests in the last 10 seconds
      if (data.requests && data.requests.length >= 5) {
        const recentRequests = data.requests.filter(timestamp => now - timestamp < 10000);
        if (recentRequests.length >= 5) {
          return true;
        }
      }
    }

    // Log this request for rapid detection
    const requestData = rapidData ? JSON.parse(rapidData) : { requests: [] };
    requestData.requests = requestData.requests || [];
    requestData.requests.push(Date.now());
    
    // Keep only last 10 requests
    requestData.requests = requestData.requests.slice(-10);
    
    await env.COFFEE_KV?.put(
      rapidKey,
      JSON.stringify(requestData),
      { expirationTtl: 60 }
    );

    // Check for suspicious user agents (empty, bot-like patterns, etc.)
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python-requests/i,
      /^$/,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  } catch (error) {
    console.error('Error detecting suspicious activity:', error);
    return false;
  }
}

async function logRequest(env, requestData) {
  try {
    const logKey = `log:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    await env.COFFEE_KV?.put(
      logKey,
      JSON.stringify(requestData),
      { expirationTtl: 86400 } // Keep logs for 24 hours
    );
  } catch (error) {
    console.error('Error logging request:', error);
  }
}