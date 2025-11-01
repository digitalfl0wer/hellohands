import { spawn } from 'node:child_process';
import express from 'express';

const app = express();
const PORT = Number(process.env.GOOSE_PROXY_PORT ?? 5174);

app.get('/api/goose/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders?.();

  const provider = process.env.GOOSE_PROVIDER ?? 'mock';
  const model =
    process.env.GOOSE_MODEL ??
    (provider === 'mock' ? 'mock-lite' : 'claude-3-5-sonnet-latest');

  const args = [
    'run',
    '--recipe',
    './goose/recipes/asl_listeners.yaml',
    '--provider',
    provider,
    '--model',
    model,
    '--params',
    'subset=100',
  ];

  const child = spawn('goose', args, { cwd: process.cwd() });

  const forward = (buffer: Buffer) => {
    buffer
      .toString()
      .split(/\r?\n/)
      .filter(Boolean)
      .forEach((line) => {
        res.write(`data: ${line}\n\n`);
      });
  };

  child.stdout.on('data', forward);
  child.stderr.on('data', forward);

  child.on('close', (code) => {
    res.write(`data: [goose exit ${code ?? 0}]\n\n`);
    res.end();
  });

  req.on('close', () => {
    child.kill();
  });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[gooseProxy] SSE @ http://localhost:${PORT}/api/goose/stream`);
});
