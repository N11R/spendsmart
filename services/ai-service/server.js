// AI Agent Service (port 4003)
// Calls the Groq API. Reads receipt photos and short expense text and
// turns them into expense fields the user can check before saving.
const express = require('express');
const multer = require('multer');
const groq = require('./groq');
const { INSTRUCTIONS, cleanResult } = require('./receipt');

const app = express();
const PORT = process.env.AI_PORT || 4003;

app.use(express.json());

// Receipt photos are kept in memory (never saved to disk), up to 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, done) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) done(null, true);
    else done(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'receipt'));
  },
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-service', model: groq.MODEL, groqKeyConfigured: groq.hasKey() });
});

// GET /ai/test: a simple Groq call to check that the key and model work
app.get('/ai/test', async (req, res) => {
  const reply = await groq.chat([
    { role: 'user', content: 'In one short sentence, give a college student one tip for sticking to a monthly budget.' },
  ]);
  res.json({ ok: true, model: groq.MODEL, reply });
});

// POST /ai/receipt (multipart form, field "receipt"): read a receipt photo
app.post('/ai/receipt', upload.single('receipt'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Upload a receipt image (JPEG, PNG, or WebP) in the "receipt" field.' });
  }

  const imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  const reply = await groq.chat(
    [
      { role: 'system', content: INSTRUCTIONS },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Read this receipt.' },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      },
    ],
    { json: true }
  );

  res.json(cleanResult(groq.parseJson(reply)));
});

// POST /ai/parse-text  { "text": "chipotle 13.50" }: turn quick text into expense fields
app.post('/ai/parse-text', async (req, res) => {
  const text = req.body?.text;
  if (typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ error: 'Send the expense as text, for example { "text": "chipotle 13.50" }.' });
  }
  if (text.length > 300) {
    return res.status(400).json({ error: 'Keep the text under 300 characters.' });
  }

  const today = new Date().toISOString().slice(0, 10);
  const reply = await groq.chat(
    [
      { role: 'system', content: `${INSTRUCTIONS}\nIf no date is given, use today's date: ${today}.` },
      { role: 'user', content: `Expense: ${text.trim()}` },
    ],
    { json: true }
  );

  res.json(cleanResult(groq.parseJson(reply)));
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// Upload problems, Groq problems, and anything unexpected
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'The receipt image must be 5 MB or smaller.'
        : 'Upload one receipt image (JPEG, PNG, or WebP) in the "receipt" field.';
    return res.status(400).json({ error: message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body must be valid JSON.' });
  }
  if (err instanceof groq.GroqError) {
    // 502 would make the frontend think the service is down, so send 422 instead
    return res.status(err.status === 429 ? 429 : 422).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong in the AI Agent Service.' });
});

app.listen(PORT, () => {
  const keyNote = groq.hasKey() ? 'Groq key loaded' : 'WARNING: GROQ_API_KEY is not set';
  console.log(`AI Agent Service running on http://localhost:${PORT} (model: ${groq.MODEL}, ${keyNote})`);
});
