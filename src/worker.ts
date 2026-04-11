/// <reference types="@cloudflare/workers-types" />

/**
 * Mimo Job Command Center — Cloudflare Worker Entry Point
 * ─────────────────────────────────────────────────────────────────────────────
 * FIXES APPLIED vs. previous version:
 *
 *  FIX 1 — Gemini API version and model names corrected
 *    BEFORE: v1beta + "gemini-1.5-flash"  → 404 Model Not Found
 *    AFTER:  v1     + "gemini-1.5-flash-latest"  (stable, promoted models)
 *            v1beta + "gemini-2.0-flash"          (preview models stay on v1beta)
 *    Rule:   gemini-1.x series  → use v1 endpoint
 *            gemini-2.x series  → use v1beta endpoint (still experimental tier)
 *
 *  FIX 2 — Claude (Anthropic) integration added
 *    Endpoint: https://api.anthropic.com/v1/messages
 *    Auth:     x-api-key header + anthropic-version header (required)
 *    Model:    claude-haiku-4-5-20251001 (lowest cost, fastest response)
 *    Fallback: claude-sonnet-4-6 (higher quality when requested)
 *
 *  FIX 3 — Dual-provider with automatic fallback
 *    Primary:  Gemini (free tier, higher quota, slightly less predictable)
 *    Fallback: Claude (paid per token, extremely stable, never silently drops models)
 *    Logic:    If Gemini returns 429 (quota) or 404 (model), retry with Claude.
 *              All other Gemini errors surface immediately (don't waste Claude tokens).
 *
 *  FIX 4 — Provider selection via request body
 *    Clients can now pass "provider": "gemini" | "claude" | "auto" (default: "auto")
 *    "auto" = try Gemini first, fall back to Claude on quota/model errors
 *
 *  FIX 5 — Structured error logging
 *    Errors now log the full Gemini/Claude response body, not just status code.
 *    This makes Cloudflare Logpush useful for debugging future issues.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface Env {
  ASSETS: Fetcher;
  [key: string]: any;
}

// ─────────────────────────────────────────────────────────────────────────────
// Model Registry
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps a friendly model name to the correct API version and canonical model ID.
 *
 * Why this matters:
 *   Google uses two parallel endpoint versions with DIFFERENT model registries.
 *   A model that exists in v1beta may not exist in v1, and vice versa.
 *   Using the wrong combination produces the exact error you encountered:
 *   "models/gemini-1.5-flash is not found for API version v1beta"
 */
const GEMINI_MODELS: Record<string, { apiVersion: 'v1' | 'v1beta'; modelId: string }> = {
  // ── Stable / Generally Available ──────────────────────────────────────────
  // These models have graduated from preview. They live on the v1 endpoint.
  'gemini-1.5-flash':         { apiVersion: 'v1',    modelId: 'gemini-1.5-flash-latest' },
  'gemini-1.5-flash-latest':  { apiVersion: 'v1',    modelId: 'gemini-1.5-flash-latest' },
  'gemini-1.5-pro':           { apiVersion: 'v1',    modelId: 'gemini-1.5-pro-latest' },
  'gemini-1.5-pro-latest':    { apiVersion: 'v1',    modelId: 'gemini-1.5-pro-latest' },

  // ── Preview / Experimental ────────────────────────────────────────────────
  // These models are still in preview. They live on the v1beta endpoint.
  'gemini-2.0-flash':         { apiVersion: 'v1beta', modelId: 'gemini-2.0-flash' },
  'gemini-2.0-flash-lite':    { apiVersion: 'v1beta', modelId: 'gemini-2.0-flash-lite' },
  'gemini-2.5-flash':         { apiVersion: 'v1beta', modelId: 'gemini-2.5-flash-preview-05-20' },
  'gemini-2.5-pro':           { apiVersion: 'v1beta', modelId: 'gemini-2.5-pro-preview-05-06' },
};

/**
 * Default model when the client sends no preference.
 *
 * gemini-2.0-flash is recommended because:
 *   - Free tier with no billing required
 *   - Highest free RPM quota of any current Gemini model
 *   - Supports JSON response mode natively
 *   - Fast enough for all use cases in this app
 */
const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash';

/**
 * Gemini HTTP status codes that warrant an automatic Claude fallback.
 * Only fall back on quota exhaustion (429) and model-not-found (404).
 * Auth errors (403), bad requests (400), and server errors (500+)
 * are surfaced immediately — retrying Claude will not help those.
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
  provider?: 'gemini' | 'claude' | 'auto';
  responseFormat?: 'text' | 'json';
}

interface AISuccessResponse {
  text: string;
  provider: 'gemini' | 'claude';
  model: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Key Detection Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Robustly retrieves a secret from the environment, checking multiple common naming conventions.
 * This handles cases where the user might have named the secret in lowercase or with a prefix.
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

      return jsonResponse(
        {
          status: 'ok',
          timestamp: new Date().toISOString(),
          secrets_detected: {
            gemini: !!detectedGemini,
            claude: !!detectedClaude,
          },
          env_keys_found: allKeys, // Lists all keys Cloudflare is passing (values are hidden)
          naming_hints: {
            gemini_expected: GEMINI_KEY_NAMES,
            claude_expected: CLAUDE_KEY_NAMES
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
  // ── Parse and validate request body ───────────────────────────────────────
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

  // ── Route to correct provider ──────────────────────────────────────────────
  try {
    if (provider === 'claude') {
      return await callClaude(body.prompt, userModel, format, env);
    }

    if (provider === 'gemini') {
      return await callGemini(body.prompt, userModel, format, env);
    }

    // provider === 'auto': try Gemini first, fall back to Claude on quota/model errors
    const geminiResult = await callGeminiRaw(body.prompt, userModel, format, env);

    if (geminiResult.ok) {
      return geminiResult.response;
    }

    // Gemini failed — decide whether to fall back to Claude
    if (GEMINI_FALLBACK_STATUS_CODES.has(geminiResult.status)) {
      console.warn(
        `Gemini returned ${geminiResult.status} — falling back to Claude. ` +
        `Reason: ${geminiResult.errorBody}`
      );

      if (!getSecret(env, CLAUDE_KEY_NAMES)) {
        return jsonError(
          `Gemini quota/model error (${geminiResult.status}) and no Claude fallback configured. ` +
          `Original error: ${geminiResult.errorBody}`,
          502
        );
      }

      return await callClaude(body.prompt, DEFAULT_CLAUDE_MODEL, format, env);
    }

    // Non-fallback Gemini error (400, 403, 500, etc.) — surface immediately
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

/**
 * Resolve a user-supplied model name to the correct Gemini endpoint config.
 *
 * If the model is unknown (e.g. a typo or a model added after this code was
 * written), we default to gemini-2.0-flash on v1beta. New Gemini models always
 * land on v1beta first, so this is the safer fallback choice.
 */
function resolveGeminiModel(modelName: string): { apiVersion: 'v1' | 'v1beta'; modelId: string } {
  return GEMINI_MODELS[modelName] ?? { apiVersion: 'v1beta', modelId: modelName };
}

/**
 * Build the correct Gemini REST URL.
 *
 * Correct format:
 *   https://generativelanguage.googleapis.com/{apiVersion}/models/{modelId}:generateContent?key={key}
 *
 * The error you saw came from using v1beta with a model (gemini-1.5-flash)
 * that had been promoted to v1. The registry check is strict on both sides.
 */
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

/** Internal: call Gemini and return a structured result without throwing. */
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
      `Checked names: ${GEMINI_KEY_NAMES.join(', ')}. ` +
      `Detected env keys: ${Object.keys(env).join(', ')}`, 
      503
    );
    return { ok: false, response: errResponse, status: 503, errorBody: 'Missing API key' };
  }

  const url = buildGeminiUrl(modelName, apiKey);

  // ── Build request payload ──────────────────────────────────────────────────
  const payload: Record<string, unknown> = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    // Safety settings — reduce chance of unnecessary blocks on professional content
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  };

  if (format === 'json') {
    payload.generationConfig = {
      responseMimeType: 'application/json',
    };
  }

  // ── Fetch ──────────────────────────────────────────────────────────────────
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

  // ── Handle non-OK responses ────────────────────────────────────────────────
  if (!geminiRes.ok) {
    const errorBody = await geminiRes.text();
    console.error(`Gemini ${geminiRes.status} for model ${modelName}:`, errorBody);
    const errResponse = jsonError(
      `AI request failed (${geminiRes.status}): ${errorBody}`,
      502
    );
    return { ok: false, response: errResponse, status: geminiRes.status, errorBody };
  }

  // ── Parse successful response ──────────────────────────────────────────────
  type GeminiResponseShape = {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
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

/** Public: call Gemini and return a Response directly (for explicit provider routing). */
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

/**
 * Call the Anthropic Messages API.
 *
 * Required headers (Anthropic will reject requests without ALL three):
 *   x-api-key          — your CLAUDE_API secret
 *   anthropic-version  — must be a valid date string; "2023-06-01" is stable
 *   content-type       — application/json
 *
 * Payload structure:
 *   {
 *     model: string,          // e.g. "claude-haiku-4-5-20251001"
 *     max_tokens: number,     // REQUIRED — Anthropic has no default; omitting = 400 error
 *     system?: string,        // optional system prompt
 *     messages: [
 *       { role: "user", content: string }
 *     ]
 *   }
 *
 * JSON output: Anthropic does not have a responseMimeType parameter.
 * We instruct the model via a system prompt and rely on the model's compliance.
 * Claude models are highly reliable at following explicit format instructions.
 */
async function callClaude(
  prompt: string,
  modelName: string,
  format: 'text' | 'json',
  env: Env
): Promise<Response> {
  const apiKey = getSecret(env, CLAUDE_KEY_NAMES);

  if (!apiKey) {
    return jsonError(
      `CLAUDE_API secret is not configured in Cloudflare Worker. ` +
      `Checked names: ${CLAUDE_KEY_NAMES.join(', ')}. ` +
      `Detected env keys: ${Object.keys(env).join(', ')}`, 
      503
    );
  }

  // If a Gemini model name was passed explicitly, use the default Claude model.
  // This happens during automatic fallback from the 'auto' provider path.
  const claudeModel = modelName.startsWith('claude-') ? modelName : DEFAULT_CLAUDE_MODEL;

  // ── Build payload ──────────────────────────────────────────────────────────
  type AnthropicPayload = {
    model: string;
    max_tokens: number;
    system?: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  };

  const anthropicPayload: AnthropicPayload = {
    model: claudeModel,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  };

  if (format === 'json') {
    anthropicPayload.system =
      'You must respond with valid JSON only. ' +
      'Do not include markdown code fences, preamble, or any text outside the JSON object. ' +
      'The response must be parseable by JSON.parse() without any preprocessing.';
  }

  // ── Fetch ──────────────────────────────────────────────────────────────────
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

  // ── Handle non-OK responses ────────────────────────────────────────────────
  if (!claudeRes.ok) {
    const errorBody = await claudeRes.text();
    console.error(`Claude ${claudeRes.status} for model ${claudeModel}:`, errorBody);
    return jsonError(`Claude API error (${claudeRes.status}): ${errorBody}`, 502);
  }

  // ── Parse successful response ──────────────────────────────────────────────
  // Anthropic response shape:
  // {
  //   id: string,
  //   type: "message",
  //   role: "assistant",
  //   content: [{ type: "text", text: string }],
  //   model: string,
  //   stop_reason: string,
  //   usage: { input_tokens: number, output_tokens: number }
  // }
  type AnthropicResponseShape = {
    content?: Array<{ type: string; text?: string }>;
    model?: string;
  };

  const data = await claudeRes.json() as AnthropicResponseShape;
  const text = data?.content?.find((c) => c.type === 'text')?.text ?? '';

  return jsonResponse<AISuccessResponse>(
    { text, provider: 'claude', model: claudeModel },
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