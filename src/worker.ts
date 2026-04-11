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

    // Health check endpoint — useful for debugging and uptime monitoring
    if (url.pathname === '/api/health' || url.pathname === '/api/debug') {
      const allKeys = Object.keys(env);
      const detectedGemini = getSecret(env, GEMINI_KEY_NAMES);
      const detectedClaude = getSecret(env, CLAUDE_KEY_NAMES);
      const detectedOpenAI = getSecret(env, OPENAI_KEY_NAMES);

      return jsonResponse(
        {
          status: 'ok',
          timestamp: new Date().toISOString(),
          secrets_detected: {
            gemini: !!detectedGemini,
            claude: !!detectedClaude,
            openai: !!detectedOpenAI,
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
};

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
// Response Helpers
// ─────────────────────────────────────────────────────────────────────────────

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
