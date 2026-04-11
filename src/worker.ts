/// <reference types="@cloudflare/workers-types" />

/**
 * Mimo Job Command Center — Cloudflare Worker Entry Point
 */

export interface Env {
  ASSETS: Fetcher;
  [key: string]: any;
}

// ─────────────────────────────────────────────────────────────────────────────
// Model Registry
// ─────────────────────────────────────────────────────────────────────────────

const GEMINI_MODELS: Record<string, { apiVersion: 'v1' | 'v1beta'; modelId: string }> = {
  // Use v1beta for everything as it's the most permissive and supports all aliases
  'gemini-1.5-flash':         { apiVersion: 'v1beta', modelId: 'gemini-1.5-flash' },
  'gemini-1.5-flash-latest':  { apiVersion: 'v1beta', modelId: 'gemini-1.5-flash' },
  'gemini-1.5-pro':           { apiVersion: 'v1beta', modelId: 'gemini-1.5-pro' },
  'gemini-1.5-pro-latest':    { apiVersion: 'v1beta', modelId: 'gemini-1.5-pro' },
  'gemini-2.0-flash':         { apiVersion: 'v1beta', modelId: 'gemini-2.0-flash' },
  'gemini-2.0-flash-lite':    { apiVersion: 'v1beta', modelId: 'gemini-2.0-flash-lite' },
  'gemini-2.5-flash':         { apiVersion: 'v1beta', modelId: 'gemini-2.5-flash-preview-05-20' },
  'gemini-2.5-pro':           { apiVersion: 'v1beta', modelId: 'gemini-2.5-pro-preview-05-06' },
};

/**
 * Default model when the client sends no preference.
 * gemini-1.5-flash is the most stable and widely available.
 */
const DEFAULT_GEMINI_MODEL = 'gemini-1.5-flash';

/**
 * Gemini HTTP status codes that warrant an automatic Claude fallback.
 * Only fall back on quota exhaustion (429) and model-not-found (404).
 */
const GEMINI_FALLBACK_STATUS_CODES = new Set([429, 404]);

// ─────────────────────────────────────────────────────────────────────────────
// Claude Model Registry
// ─────────────────────────────────────────────────────────────────────────────

const CLAUDE_MODELS = {
  /** Fastest and cheapest. Suitable for most generation tasks in this app. */
  fast:    'claude-haiku-4-5-20251001',
  /** Higher quality reasoning. Preferred for cover letters, complex analysis. */
  quality: 'claude-sonnet-4-6',
};

const DEFAULT_CLAUDE_MODEL = CLAUDE_MODELS.fast;

// ─────────────────────────────────────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Request / Response Types
// ─────────────────────────────────────────────────────────────────────────────

interface AIRequestBody {
  prompt: string;
  model?: string;
  provider?: 'gemini' | 'claude' | 'openai' | 'auto';
  responseFormat?: 'text' | 'json';
}

interface AISuccessResponse {
  text: string;
  provider: 'gemini' | 'claude' | 'openai';
  model: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Key Detection Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Robustly retrieves a secret from the environment, checking multiple common naming conventions.
 */
function getSecret(env: any, possibleKeys: string[]): string | undefined {
  for (const key of possibleKeys) {
    if (env[key] && typeof env[key] === 'string' && env[key].trim() !== '') {
      return env[key].trim();
    }
  }
  return undefined;
}

const GEMINI_KEY_NAMES = ['GEMINI_API_KEY', 'gemini_api_key', 'VITE_GEMINI_API_KEY', 'GOOGLE_AI_STUDIO_URL'];
const CLAUDE_KEY_NAMES = ['CLAUDE_API', 'claude_api', 'mimo_job_tracker_claude', 'CLAUDE_API_KEY'];
const OPENAI_KEY_NAMES = ['OPENAI_API_KEY', 'openai_api_key', 'OPEN_AI_API_KEY'];

// ─────────────────────────────────────────────────────────────────────────────
// Worker Entry Point
// ─────────────────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (url.pathname === '/api/ai' && request.method === 'POST') {
      return handleAIRequest(request, env);
    }

    // OAuth Routes
    if (url.pathname === '/api/auth/google/url') {
      return handleGoogleAuthUrl(request, env);
    }
    if (url.pathname === '/auth/google/callback') {
      return handleGoogleCallback(request, env);
    }
    if (url.pathname === '/api/auth/linkedin/url') {
      return handleLinkedInAuthUrl(request, env);
    }
    if (url.pathname === '/auth/linkedin/callback') {
      return handleLinkedInCallback(request, env);
    }
    if (url.pathname === '/api/linkedin/profile') {
      return handleLinkedInProfile(request, env);
    }
    if (url.pathname === '/api/linkedin/post' && request.method === 'POST') {
      return handleLinkedInPost(request, env);
    }
    if (url.pathname === '/api/webhooks/linkedin') {
      return handleLinkedInWebhook(request, env);
    }

    // Settings Endpoint
    if (url.pathname === '/api/settings') {
      const db = env.DB || env['my-binding'];
      if (!db) return jsonError('D1 Database not bound', 500);
      try {
        const { results } = await db.prepare('SELECT key FROM settings').all();
        const connections = {
          google: results.some(r => r.key === 'google_tokens'),
          linkedin: results.some(r => r.key === 'linkedin_tokens'),
        };
        return jsonResponse({ connections }, 200);
      } catch (e) {
        return jsonError(`DB Error: ${e instanceof Error ? e.message : String(e)}`, 500);
      }
    }

    if (url.pathname === '/api/settings/disconnect' && request.method === 'POST') {
      const db = env.DB || env['my-binding'];
      if (!db) return jsonError('D1 Database not bound', 500);
      const provider = url.searchParams.get('provider');
      if (!provider) return jsonError('Missing provider', 400);
      
      const key = provider === 'google' ? 'google_tokens' : 'linkedin_tokens';
      try {
        await db.prepare('DELETE FROM settings WHERE key = ?').bind(key).run();
        return jsonResponse({ success: true }, 200);
      } catch (e) {
        return jsonError(`DB Error: ${e instanceof Error ? e.message : String(e)}`, 500);
      }
    }

    // Automation Logs Endpoint
    if (url.pathname === '/api/automation/logs') {
      const db = env.DB || env['my-binding'];
      if (!db) return jsonError('D1 Database not bound', 500);
      try {
        const { results } = await db.prepare(
          'SELECT * FROM automation_logs ORDER BY created_at DESC LIMIT 50'
        ).all();
        return jsonResponse(results, 200);
      } catch (e) {
        return jsonError(`DB Error: ${e instanceof Error ? e.message : String(e)}`, 500);
      }
    }

    // Health check endpoint — useful for debugging and uptime monitoring
    if (url.pathname === '/api/health' || url.pathname === '/api/debug') {
      const allKeys = Object.keys(env);
      const detectedGemini = getSecret(env, GEMINI_KEY_NAMES);
      const detectedClaude = getSecret(env, CLAUDE_KEY_NAMES);
      const detectedOpenAI = getSecret(env, OPENAI_KEY_NAMES);
      const db = env.DB || env['my-binding'];

      return jsonResponse(
        {
          status: 'ok',
          timestamp: new Date().toISOString(),
          secrets_detected: {
            gemini: !!detectedGemini,
            claude: !!detectedClaude,
            openai: !!detectedOpenAI,
            db: !!db
          },
          env_keys_found: allKeys,
          naming_hints: {
            gemini_expected: GEMINI_KEY_NAMES,
            claude_expected: CLAUDE_KEY_NAMES,
            openai_expected: OPENAI_KEY_NAMES
          }
        },
        200
      );
    }

    return env.ASSETS.fetch(request);
  },

  /**
   * Autonomous Job Hunter — Runs on a schedule (Cron)
   */
  async scheduled(event: any, env: Env, ctx: any) {
    ctx.waitUntil(runAutonomousJobHunter(env));
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Autonomous Job Hunter Logic
// ─────────────────────────────────────────────────────────────────────────────

async function runAutonomousJobHunter(env: Env) {
  console.log('Starting Autonomous Job Hunter...');
  
  // User Provided Configuration
  const TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN || '8318826404:AAE-6BapS_OMohQj3-_h2u-r2LMv_JF_WIw';
  const TELEGRAM_CHAT_ID = env.TELEGRAM_CHAT_ID || '5350228504';
  const GOOGLE_SHEET_ID = '1a4FtfiXNiPrxDXpBCIPtLhSqfIP3M6lrYPKJvzZaVZc';
  
  const RSS_FEEDS = [
    'https://www.google.com/alerts/feeds/03687472253009828433/16481201381916462064', // Retail Ops Dubai
    // Add more feeds here as needed
  ];

  const db = env.DB || env['my-binding'];

  if (!db) {
    console.error('D1 Database not bound. Skipping automation.');
    return;
  }

  for (const feedUrl of RSS_FEEDS) {
    try {
      // 1. Fetch RSS Feed
      const res = await fetch(feedUrl);
      const xml = await res.text();

      // 2. Parse XML
      const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
      console.log(`Feed: ${feedUrl} - Found ${entries.length} entries.`);

      for (const entry of entries) {
        const title = (entry.match(/<title type="html">([\s\S]*?)<\/title>/) || [])[1] || 'No Title';
        const link = (entry.match(/<link href="([\s\S]*?)"/) || [])[1] || '';
        const content = (entry.match(/<content type="html">([\s\S]*?)<\/content>/) || [])[1] || '';
        const id = (entry.match(/<id>([\s\S]*?)<\/id>/) || [])[1] || link;

        // 3. Deduplication (D1)
        const existing = await db.prepare('SELECT id FROM automation_logs WHERE job_id = ?').bind(id).first();
        if (existing) continue;

        console.log(`Processing: ${title}`);

        // 4. AI Scoring & Extraction
        const prompt = `Analyze this job for Mimo (Senior Ops Specialist).
        Title: ${title}
        Content: ${content}
        
        Return JSON:
        {
          "score": 0-100,
          "bucket": "PRIMARY" | "SECONDARY" | "OTHER",
          "reason": "1-2 sentences",
          "apply": boolean,
          "extracted_email": "email or null",
          "email_subject": "subject line",
          "email_body": "personalized body"
        }`;

        const aiRes = await handleAIRequest(new Request('http://local/api/ai', {
          method: 'POST',
          body: JSON.stringify({ prompt, responseFormat: 'json' })
        }), env);
        
        const aiData = await aiRes.json() as any;
        const analysis = JSON.parse(aiData.text.replace(/```json|```/g, '').trim());

        // 5. Auto-Apply Logic (Email Path)
        let applyStatus = analysis.apply ? 'PENDING' : 'SKIPPED';
        if (analysis.apply && analysis.extracted_email) {
          // Here we would call a Gmail/SendGrid API. For now, we mark as READY_TO_EMAIL
          applyStatus = 'READY_TO_EMAIL';
        }

        // 6. Log to D1
        await db.prepare(
          'INSERT INTO automation_logs (job_id, title, url, score, bucket, reason, apply_status) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(id, title, link, analysis.score, analysis.bucket, analysis.reason, applyStatus).run();

        // 6b. Log to Google Sheets (if connected)
        try {
          await appendToGoogleSheet(env, GOOGLE_SHEET_ID, [
            new Date().toISOString(),
            'Google Alerts',
            title,
            '', // Company (could extract with AI)
            '', // Location
            link,
            analysis.reason,
            analysis.score,
            analysis.bucket,
            analysis.apply ? 'YES' : 'NO',
            applyStatus,
            analysis.extracted_email || ''
          ]);
        } catch (sheetErr) {
          console.error('Sheet Log Error:', sheetErr);
        }

        // 6c. Send Gmail (if connected and email found)
        if (applyStatus === 'READY_TO_EMAIL' && analysis.extracted_email) {
          try {
            await sendGmail(env, analysis.extracted_email, analysis.email_subject, analysis.email_body);
            await db.prepare('UPDATE automation_logs SET apply_status = ? WHERE job_id = ?')
              .bind('EMAILED', id)
              .run();
          } catch (gmailErr) {
            console.error('Gmail Send Error:', gmailErr);
          }
        }

        // 7. Telegram Notification
        if (analysis.score >= 70) {
          const statusEmoji = applyStatus === 'READY_TO_EMAIL' ? '📧' : '🚀';
          const message = `${statusEmoji} *Job Match (${analysis.score}%)*\n\n*Title:* ${title}\n*Bucket:* ${analysis.bucket}\n*Reason:* ${analysis.reason}\n${analysis.extracted_email ? `*Contact:* ${analysis.extracted_email}\n` : ''}\n[View & Apply](${link})`;
          
          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: TELEGRAM_CHAT_ID,
              text: message,
              parse_mode: 'Markdown'
            })
          });
        }
        
        // 8. Google Sheets (Optional: Requires Service Account setup)
        // For now, D1 is our primary source of truth which the UI displays.
      }
    } catch (error) {
      console.error(`Error processing feed ${feedUrl}:`, error);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main AI Request Handler
// ─────────────────────────────────────────────────────────────────────────────

async function handleAIRequest(request: Request, env: Env): Promise<Response> {
  let body: AIRequestBody;
  try {
    body = await request.json() as AIRequestBody;
  } catch {
    return jsonError('Request body must be valid JSON', 400);
  }

  if (!body.prompt || typeof body.prompt !== 'string' || body.prompt.trim() === '') {
    return jsonError('Missing required field: prompt (must be a non-empty string)', 400);
  }

  const provider  = body.provider ?? 'auto';
  const format    = body.responseFormat ?? 'text';
  const userModel = body.model ?? DEFAULT_GEMINI_MODEL;

  try {
    if (provider === 'openai') {
      return await callOpenAI(body.prompt, userModel, format, env);
    }

    if (provider === 'claude') {
      return await callClaude(body.prompt, userModel, format, env);
    }

    if (provider === 'gemini') {
      return await callGemini(body.prompt, userModel, format, env);
    }

    const geminiResult = await callGeminiRaw(body.prompt, userModel, format, env);

    if (geminiResult.ok) {
      return geminiResult.response;
    }

    if (GEMINI_FALLBACK_STATUS_CODES.has(geminiResult.status)) {
      console.warn(`Gemini returned ${geminiResult.status} — falling back to next provider.`);

      // Try OpenAI first if available, then Claude
      if (getSecret(env, OPENAI_KEY_NAMES)) {
        return await callOpenAI(body.prompt, 'gpt-4o-mini', format, env);
      }

      if (getSecret(env, CLAUDE_KEY_NAMES)) {
        return await callClaude(body.prompt, DEFAULT_CLAUDE_MODEL, format, env);
      }

      return jsonError(
        `Gemini quota/model error (${geminiResult.status}) and no fallback (OpenAI/Claude) configured. ` +
        `Original error: ${geminiResult.errorBody}`,
        502
      );
    }

    return jsonError(
      `AI service error (${geminiResult.status}): ${geminiResult.errorBody}`,
      502
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('handleAIRequest unhandled error:', message);
    return jsonError(`Internal server error: ${message}`, 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Gemini Integration
// ─────────────────────────────────────────────────────────────────────────────

function resolveGeminiModel(modelName: string): { apiVersion: 'v1' | 'v1beta'; modelId: string } {
  return GEMINI_MODELS[modelName] ?? { apiVersion: 'v1beta', modelId: modelName };
}

function buildGeminiUrl(modelName: string, apiKey: string): string {
  const { apiVersion, modelId } = resolveGeminiModel(modelName);
  return (
    `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelId}` +
    `:generateContent?key=${apiKey}`
  );
}

interface GeminiRawResult {
  ok: boolean;
  response: Response;
  status: number;
  errorBody: string;
}

async function callGeminiRaw(
  prompt: string,
  modelName: string,
  format: 'text' | 'json',
  env: Env
): Promise<GeminiRawResult> {
  const apiKey = getSecret(env, GEMINI_KEY_NAMES);
  
  if (!apiKey) {
    const errResponse = jsonError(
      `GEMINI_API_KEY secret is not configured in Cloudflare Worker. ` +
      `Checked names: ${GEMINI_KEY_NAMES.join(', ')}.`, 
      503
    );
    return { ok: false, response: errResponse, status: 503, errorBody: 'Missing API key' };
  }

  const url = buildGeminiUrl(modelName, apiKey);

  const payload: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  };

  if (format === 'json') {
    payload.generationConfig = { responseMimeType: 'application/json' };
  }

  let geminiRes: globalThis.Response;
  try {
    geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (networkErr) {
    const msg = networkErr instanceof Error ? networkErr.message : String(networkErr);
    const errResponse = jsonError(`Network error reaching Gemini: ${msg}`, 502);
    return { ok: false, response: errResponse, status: 502, errorBody: msg };
  }

  if (!geminiRes.ok) {
    const errorBody = await geminiRes.text();
    const errResponse = jsonError(`AI request failed (${geminiRes.status}): ${errorBody}`, 502);
    return { ok: false, response: errResponse, status: geminiRes.status, errorBody };
  }

  type GeminiResponseShape = {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const data = await geminiRes.json() as GeminiResponseShape;
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const { modelId } = resolveGeminiModel(modelName);

  const successResponse = jsonResponse<AISuccessResponse>(
    { text, provider: 'gemini', model: modelId },
    200
  );

  return { ok: true, response: successResponse, status: 200, errorBody: '' };
}

async function callGemini(
  prompt: string,
  modelName: string,
  format: 'text' | 'json',
  env: Env
): Promise<Response> {
  const result = await callGeminiRaw(prompt, modelName, format, env);
  return result.response;
}

// ─────────────────────────────────────────────────────────────────────────────
// Claude (Anthropic) Integration
// ─────────────────────────────────────────────────────────────────────────────

async function callClaude(
  prompt: string,
  modelName: string,
  format: 'text' | 'json',
  env: Env
): Promise<Response> {
  const apiKey = getSecret(env, CLAUDE_KEY_NAMES);

  if (!apiKey) {
    return jsonError(`CLAUDE_API secret is not configured in Cloudflare Worker.`, 503);
  }

  const claudeModel = modelName.startsWith('claude-') ? modelName : DEFAULT_CLAUDE_MODEL;

  const anthropicPayload = {
    model: claudeModel,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  };

  if (format === 'json') {
    (anthropicPayload as any).system = 'You must respond with valid JSON only.';
  }

  let claudeRes: globalThis.Response;
  try {
    claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(anthropicPayload),
    });
  } catch (networkErr) {
    const msg = networkErr instanceof Error ? networkErr.message : String(networkErr);
    return jsonError(`Network error reaching Anthropic: ${msg}`, 502);
  }

  if (!claudeRes.ok) {
    const errorBody = await claudeRes.text();
    return jsonError(`Claude API error (${claudeRes.status}): ${errorBody}`, 502);
  }

  const data = await claudeRes.json() as any;
  const text = data?.content?.find((c: any) => c.type === 'text')?.text ?? '';

  return jsonResponse<AISuccessResponse>(
    { text, provider: 'claude', model: claudeModel },
    200
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OpenAI Integration
// ─────────────────────────────────────────────────────────────────────────────

async function callOpenAI(
  prompt: string,
  modelName: string,
  format: 'text' | 'json',
  env: Env
): Promise<Response> {
  const apiKey = getSecret(env, OPENAI_KEY_NAMES);

  if (!apiKey) {
    return jsonError(`OPENAI_API_KEY secret is not configured in Cloudflare Worker.`, 503);
  }

  const openAIModel = modelName.startsWith('gpt-') ? modelName : 'gpt-4o-mini';

  const payload: any = {
    model: openAIModel,
    messages: [{ role: 'user', content: prompt }],
  };

  if (format === 'json') {
    payload.response_format = { type: 'json_object' };
    payload.messages.push({ 
      role: 'system', 
      content: 'You must respond with valid JSON only.' 
    });
  }

  let openAIRes: globalThis.Response;
  try {
    openAIRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (networkErr) {
    const msg = networkErr instanceof Error ? networkErr.message : String(networkErr);
    return jsonError(`Network error reaching OpenAI: ${msg}`, 502);
  }

  if (!openAIRes.ok) {
    const errorBody = await openAIRes.text();
    return jsonError(`OpenAI API error (${openAIRes.status}): ${errorBody}`, 502);
  }

  const data = await openAIRes.json() as any;
  const text = data?.choices?.[0]?.message?.content ?? '';

  return jsonResponse<AISuccessResponse>(
    { text, provider: 'openai', model: openAIModel },
    200
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OAuth Handlers
// ─────────────────────────────────────────────────────────────────────────────

async function handleGoogleAuthUrl(request: Request, env: Env) {
  const clientId = env.GOOGLE_CLIENT_ID;
  if (!clientId) return jsonError('GOOGLE_CLIENT_ID not configured', 500);

  const url = new URL(request.url);
  const clientOrigin = url.searchParams.get('origin') || url.origin.replace('http://', 'https://');
  const redirectUri = `${clientOrigin}/auth/google/callback`;
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email openid',
    access_type: 'offline',
    prompt: 'consent',
    state: clientOrigin, // Pass origin in state
  });

  return jsonResponse({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` }, 200);
}

async function handleGoogleCallback(request: Request, env: Env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state'); // Recover origin from state
  if (!code) return jsonError('No code provided', 400);

  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  const clientOrigin = state || url.origin.replace('http://', 'https://');
  const redirectUri = `${clientOrigin}/auth/google/callback`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  const tokens = await tokenRes.json() as any;
  if (tokens.error) return jsonError(`Google Token Error: ${tokens.error_description || tokens.error}`, 500);

  const db = env.DB || env['my-binding'];
  if (db) {
    await db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)')
      .bind('google_tokens', JSON.stringify(tokens))
      .run();
  }

  return new Response(`
    <html>
      <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f9fafb;">
        <div style="text-align: center; padding: 2rem; background: white; border-radius: 1rem; shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
          <h1 style="color: #10b981;">Connected!</h1>
          <p style="color: #4b5563;">Google account linked successfully. This window will close.</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'google' }, '*');
              setTimeout(() => window.close(), 2000);
            }
          </script>
        </div>
      </body>
    </html>
  `, { headers: { 'Content-Type': 'text/html' } });
}

async function handleLinkedInAuthUrl(request: Request, env: Env) {
  const clientId = env.LINKEDIN_CLIENT_ID;
  if (!clientId) return jsonError('LINKEDIN_CLIENT_ID not configured', 500);

  const url = new URL(request.url);
  const clientOrigin = url.searchParams.get('origin') || url.origin.replace('http://', 'https://');
  const redirectUri = `${clientOrigin}/auth/linkedin/callback`;
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'openid profile email w_member_social',
    state: clientOrigin, // Pass origin in state
  });

  return jsonResponse({ url: `https://www.linkedin.com/oauth/v2/authorization?${params}` }, 200);
}

async function handleLinkedInCallback(request: Request, env: Env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state'); // Recover origin from state
  if (!code) return jsonError('No code provided', 400);

  const clientId = env.LINKEDIN_CLIENT_ID;
  const clientSecret = env.LINKEDIN_CLIENT_SECRET;
  const clientOrigin = state || url.origin.replace('http://', 'https://');
  const redirectUri = `${clientOrigin}/auth/linkedin/callback`;

  const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });

  const tokens = await tokenRes.json() as any;
  if (tokens.error) return jsonError(`LinkedIn Token Error: ${tokens.error_description || tokens.error}`, 500);

  const db = env.DB || env['my-binding'];
  if (db) {
    await db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)')
      .bind('linkedin_tokens', JSON.stringify(tokens))
      .run();
  }

  return new Response(`
    <html>
      <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f9fafb;">
        <div style="text-align: center; padding: 2rem; background: white; border-radius: 1rem; shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
          <h1 style="color: #0077b5;">Connected!</h1>
          <p style="color: #4b5563;">LinkedIn account linked successfully. This window will close.</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'linkedin' }, '*');
              setTimeout(() => window.close(), 2000);
            }
          </script>
        </div>
      </body>
    </html>
  `, { headers: { 'Content-Type': 'text/html' } });
}

async function handleLinkedInProfile(request: Request, env: Env) {
  const accessToken = await getLinkedInAccessToken(env);
  if (!accessToken) return jsonError('LinkedIn not connected', 401);

  try {
    // 1. Modern OpenID User Info
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const profile = await profileRes.json() as any;

    // 2. Network Size (Followers)
    let followers = 0;
    try {
      // Use the sub (ID) from the userinfo response
      const networkRes = await fetch(`https://api.linkedin.com/v2/networkSizes/urn:li:person:${profile.sub}?edgeType=COMPANY_FOLLOWED_BY_MEMBER`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const network = await networkRes.json() as any;
      followers = network.firstDegreeSize || 0;
    } catch (e) {
      console.error('LinkedIn Network Size Error:', e);
    }

    return jsonResponse({
      id: profile.sub,
      firstName: profile.given_name,
      lastName: profile.family_name,
      email: profile.email,
      picture: profile.picture,
      followers: followers || 0,
      impressions: 0, 
    }, 200);
  } catch (e) {
    return jsonError(`LinkedIn Profile Error: ${e instanceof Error ? e.message : String(e)}`, 500);
  }
}

async function handleLinkedInPost(request: Request, env: Env) {
  const accessToken = await getLinkedInAccessToken(env);
  if (!accessToken) return jsonError('LinkedIn not connected', 401);

  try {
    const { text } = await request.json() as { text: string };
    if (!text) return jsonError('Missing text', 400);

    // Get user ID first
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const profile = await profileRes.json() as any;
    const authorUrn = `urn:li:person:${profile.sub}`;

    const postRes = await fetch('https://api.linkedin.com/v2/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify({
        author: authorUrn,
        commentary: text,
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: []
        },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false
      })
    });

    if (!postRes.ok) {
      const err = await postRes.text();
      return jsonError(`LinkedIn Post Error: ${err}`, postRes.status);
    }

    return jsonResponse({ status: 'success' }, 201);
  } catch (e) {
    return jsonError(`LinkedIn Post Error: ${e instanceof Error ? e.message : String(e)}`, 500);
  }
}

async function handleLinkedInWebhook(request: Request, env: Env) {
  // LinkedIn Webhook Challenge
  const url = new URL(request.url);
  const challenge = url.searchParams.get('challenge');
  if (challenge) {
    return new Response(challenge, { status: 200 });
  }

  // Handle actual events
  try {
    const event = await request.json() as any;
    console.log('LinkedIn Webhook Event:', JSON.stringify(event));
    
    // AI Profile Optimization Architect Logic
    // We want to detect if the event is related to "Recruiter" activity or "Azerbaijan" location
    let bucket = 'WEBHOOK';
    let reason = `Received event: ${event.type || 'unknown'}`;
    let score = 0;

    // Heuristic analysis (in a real app, we'd use Gemini here)
    const eventStr = JSON.stringify(event).toLowerCase();
    const isRecruiterRelated = eventStr.includes('recruiter') || eventStr.includes('hiring') || eventStr.includes('talent');
    const isAzerbaijanRelated = eventStr.includes('azerbaijan') || eventStr.includes('baku');
    const isUAERelated = eventStr.includes('uae') || eventStr.includes('dubai') || eventStr.includes('abu dhabi');

    if (isRecruiterRelated || isAzerbaijanRelated) {
      bucket = 'LI_MISMATCH';
      score = 100; // High priority mismatch
      reason = `Mismatch Detected: ${isRecruiterRelated ? '[Recruiter Intent]' : ''} ${isAzerbaijanRelated ? '[Azerbaijan Location]' : ''}`;
    } else if (isUAERelated) {
      bucket = 'LI_OPTIMIZATION';
      score = 50;
      reason = 'Positive Signal: UAE Market Interaction detected.';
    }

    // Log to D1 for visibility in Automation Hub
    const db = env.DB || env['my-binding'];
    if (db) {
      await db.prepare(
        'INSERT INTO automation_logs (job_id, title, url, score, bucket, reason, apply_status) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        `li_event_${Date.now()}`,
        'LinkedIn Optimization Architect',
        '#',
        score,
        bucket,
        reason,
        'INFO'
      ).run();
    }

    return new Response('OK', { status: 200 });
  } catch (e) {
    return new Response('Error', { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Google API Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function getLinkedInAccessToken(env: Env) {
  const db = env.DB || env['my-binding'];
  if (!db) return null;

  const row = await db.prepare('SELECT value FROM settings WHERE key = ?').bind('linkedin_tokens').first();
  if (!row) return null;

  const tokens = JSON.parse(row.value as string);
  return tokens.access_token;
}

async function getGoogleAccessToken(env: Env) {
  const db = env.DB || env['my-binding'];
  if (!db) return null;

  const row = await db.prepare('SELECT value FROM settings WHERE key = ?').bind('google_tokens').first();
  if (!row) return null;

  const tokens = JSON.parse(row.value as string);
  
  // Simple check if token is expired (Google tokens usually last 1 hour)
  // For a robust app, we should check expiry and use refresh_token
  // But for now, we'll try to refresh if we have a refresh_token
  if (tokens.refresh_token) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        refresh_token: tokens.refresh_token,
        grant_type: 'refresh_token',
      }),
    });
    const newTokens = await res.json() as any;
    if (!newTokens.error) {
      const updated = { ...tokens, ...newTokens };
      await db.prepare('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?')
        .bind(JSON.stringify(updated), 'google_tokens')
        .run();
      return updated.access_token;
    }
  }

  return tokens.access_token;
}

async function appendToGoogleSheet(env: Env, spreadsheetId: string, values: any[]) {
  const accessToken = await getGoogleAccessToken(env);
  if (!accessToken) return;

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [values],
    }),
  });
}

async function sendGmail(env: Env, to: string, subject: string, body: string) {
  const accessToken = await getGoogleAccessToken(env);
  if (!accessToken) return;

  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const message = [
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
  ].join('\r\n');

  const encodedMessage = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedMessage,
    }),
  });
}

function jsonResponse<T>(body: T, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

function jsonError(message: string, status: number): Response {
  return jsonResponse({ error: message }, status);
}
