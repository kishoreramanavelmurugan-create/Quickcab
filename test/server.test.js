const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');

test('register endpoint works even when MongoDB is unavailable', async () => {
  const server = spawn(process.execPath, ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: '3100' },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let output = '';
  server.stdout.on('data', (chunk) => {
    output += chunk.toString();
  });
  server.stderr.on('data', (chunk) => {
    output += chunk.toString();
  });

  try {
    await delay(2500);

    const response = await fetch('http://127.0.0.1:3100/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        password: 'secret123'
      })
    });

    const data = await response.json();

    assert.equal(response.status, 200);
    assert.equal(data.message, 'Register Success');
  } finally {
    server.kill('SIGTERM');
    await delay(500);
  }
});
