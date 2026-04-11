/**
 * src/lib/ai.ts — Centralised AI Client for Mimo Job Command Center
 *
 * All components must import and use these functions instead of instantiating
 * GoogleGenAI directly. This ensures:
 *   1. The API key is never in the browser bundle
 *   2. All requests are routed through the Cloudflare Worker proxy at /api/ai
 *   3. There is a single place to update models, retry logic, or error handling
 */

const AI_ENDPOINT = '/api/ai';

interface AIRequestOptions {
  model?: string;
  provider?: 'gemini' | 'claude' | 'auto';
  responseFormat?: 'text' | 'json';
}

interface AIResponse {
  text: string;
}

/**
 * Generate text content from a prompt.
 * Replaces: ai.models.generateContent({ model, contents: prompt })
 */
export async function generateText(
  prompt: string,
  options: AIRequestOptions = {}
): Promise<string> {
  const response = await fetch(AI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      model: options.model ?? 'gemini-1.5-flash',
      provider: options.provider ?? 'auto',
      responseFormat: 'text',
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(`AI request failed (${response.status}): ${(err as { error: string }).error}`);
  }

  const data: AIResponse = await response.json();
  return data.text;
}

/**
 * Generate structured JSON from a prompt.
 * Replaces: ai.models.generateContent({ config: { responseMimeType: 'application/json' } })
 * Automatically parses and returns the JSON object.
 */
export async function generateJSON<T = unknown>(
  prompt: string,
  options: Omit<AIRequestOptions, 'responseFormat'> = {}
): Promise<T> {
  const response = await fetch(AI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      model: options.model ?? 'gemini-1.5-flash',
      provider: options.provider ?? 'auto',
      responseFormat: 'json',
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(`AI request failed (${response.status}): ${(err as { error: string }).error}`);
  }

  const data: AIResponse = await response.json();

  try {
    // Strip potential markdown code fences before parsing
    const cleaned = data.text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(`AI returned malformed JSON: ${data.text.slice(0, 200)}`);
  }
}
