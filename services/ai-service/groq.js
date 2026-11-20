// Talks to the Groq API. The API key stays here on the server and is
// never sent to the frontend.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env'), quiet: true });

const GROQ_URL = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
// A Groq model that can read both text and images
const MODEL = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';

class GroqError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.status = status;
  }
}

function hasKey() {
  return Boolean(process.env.GROQ_API_KEY);
}

// Sends chat messages to Groq and returns the reply text
async function chat(messages, { json = false } = {}) {
  if (!hasKey()) {
    throw new GroqError('GROQ_API_KEY is missing. Add it to the .env file in the project root.', 500);
  }

  let response;
  try {
    response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.2,
        ...(json && { response_format: { type: 'json_object' } }),
      }),
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    throw new GroqError('Could not reach the Groq API.');
  }

  if (!response.ok) {
    const detail = await response.text();
    console.error(`Groq error ${response.status}: ${detail.slice(0, 300)}`);
    if (response.status === 401) throw new GroqError('The Groq API key was rejected. Check GROQ_API_KEY in .env.');
    if (response.status === 429) throw new GroqError('Groq rate limit reached. Wait a minute and try again.', 429);
    throw new GroqError(`Groq returned an error (${response.status}).`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  // Some models include their reasoning in <think> tags; keep only the answer
  return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

// Pulls the JSON object out of a reply, even if extra text surrounds it
function parseJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new GroqError('The AI did not return valid JSON.');
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new GroqError('The AI did not return valid JSON.');
  }
}

module.exports = { chat, parseJson, hasKey, GroqError, MODEL };
