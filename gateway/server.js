// API Gateway (port 4000)
// The React frontend only ever talks to this server. It forwards each
// /api/... request to the service that owns it, so the frontend never
// needs to know where the services run.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });
const http = require('http');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.GATEWAY_PORT || process.env.PORT || 4000;

// Where each service lives. /api/<prefix> is forwarded to <url>/<prefix>.
const SERVICES = {
  expenses: process.env.EXPENSE_SERVICE_URL || 'http://localhost:4001',
  budgets: process.env.BUDGET_SERVICE_URL || 'http://localhost:4002',
  ai: process.env.AI_SERVICE_URL || 'http://localhost:4003',
};

app.use(cors());
// No express.json() here on purpose: the gateway passes request bodies
// (JSON or receipt images) straight through to the services.

// Simple request log, e.g. "POST /api/expenses -> 201 (12 ms)"
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start} ms)`);
  });
  next();
});

// GET /api/health: checks the gateway and every service behind it
app.get('/api/health', async (req, res) => {
  const services = {};
  await Promise.all(
    Object.entries(SERVICES).map(async ([name, url]) => {
      try {
        const response = await fetch(`${url}/health`, { signal: AbortSignal.timeout(1500) });
        services[name] = response.ok ? 'up' : 'down';
      } catch {
        services[name] = 'down';
      }
    })
  );
  const allUp = Object.values(services).every((s) => s === 'up');
  res.json({ status: allUp ? 'ok' : 'degraded', gateway: 'up', services });
});

// Forwards the request to a service and streams the answer back
function forwardTo(serviceUrl, serviceName) {
  return (req, res) => {
    const target = new URL(req.originalUrl.replace(/^\/api/, ''), serviceUrl);

    const proxyReq = http.request(
      target,
      { method: req.method, headers: { ...req.headers, host: target.host } },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );

    proxyReq.on('error', () => {
      if (!res.headersSent) {
        res.status(503).json({ error: `The ${serviceName} service is not running.` });
      }
    });

    req.pipe(proxyReq);
  };
}

app.use('/api/expenses', forwardTo(SERVICES.expenses, 'expense'));
app.use('/api/budgets', forwardTo(SERVICES.budgets, 'budget'));
app.use('/api/ai', forwardTo(SERVICES.ai, 'AI agent'));

// Anything else under /api doesn't exist
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on http://localhost:${PORT}`);
});
