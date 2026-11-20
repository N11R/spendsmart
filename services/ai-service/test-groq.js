// Quick check that the Groq API key and model work, without starting the server.
// Run with: npm run test-groq (from the project root)
const groq = require('./groq');

groq
  .chat([{ role: 'user', content: 'Reply with exactly: SpendSmart is connected to Groq.' }])
  .then((reply) => {
    console.log(`Groq call succeeded (model: ${groq.MODEL})`);
    console.log(`Reply: ${reply}`);
  })
  .catch((err) => {
    console.error(`Groq call failed: ${err.message}`);
    process.exitCode = 1;
  });
