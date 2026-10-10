const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const app = require('../src/server');

// README: "Events are listed in date order, earliest first." and
// "Deleting an id that doesn't exist is a `404`."

let server;
let baseUrl;
let realWriteFileSync;
const dbPath = path.join(__dirname, '..', 'data', 'events.json');

before(() => {
  process.env.ADMIN_TOKEN = 'test-token';

  // These tests create and delete events. Swallow writes to data/events.json so the
  // real file is never touched (and cannot race with tests/routes.test.js, which
  // node --test runs in a separate process).
  realWriteFileSync = fs.writeFileSync;
  fs.writeFileSync = function (file, ...args) {
    if (path.resolve(String(file)) === dbPath) return;
    return realWriteFileSync.call(fs, file, ...args);
  };

  return new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://localhost:${server.address().port}`;
      resolve();
    });
  });
});

after(() => {
  fs.writeFileSync = realWriteFileSync;
  server.close();
});

async function postEvent(title, date) {
  const res = await fetch(`${baseUrl}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, date, location: 'Lab 2' })
  });
  assert.strictEqual(res.status, 201);
  return res.json();
}

async function deleteEvent(id) {
  return fetch(`${baseUrl}/events/${id}`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer test-token' }
  });
}

test('GET /events lists events in date order, earliest first', async () => {
  // Created out of date order on purpose, so insertion order differs from date order.
  await postEvent('order-late', '2031-03-03');
  await postEvent('order-early', '2031-01-01');
  await postEvent('order-middle', '2031-02-02');

  const res = await fetch(`${baseUrl}/events`);
  assert.strictEqual(res.status, 200);
  const events = await res.json();

  const ours = events.filter((e) => e.title.startsWith('order-')).map((e) => e.title);
  assert.deepStrictEqual(ours, ['order-early', 'order-middle', 'order-late']);
});

test('DELETE /events/:id with an unknown id returns 404 and removes nothing', async () => {
  const before = await (await fetch(`${baseUrl}/events`)).json();

  const res = await deleteEvent(999999);
  assert.strictEqual(res.status, 404);

  const after = await (await fetch(`${baseUrl}/events`)).json();
  assert.deepStrictEqual(after, before);
});

test('DELETE /events/:id twice returns 404 the second time', async () => {
  const ev = await postEvent('delete-twice', '2031-04-04');

  assert.strictEqual((await deleteEvent(ev.id)).status, 200);
  assert.strictEqual((await deleteEvent(ev.id)).status, 404);

  const events = await (await fetch(`${baseUrl}/events`)).json();
  assert.ok(!events.some((e) => e.id === ev.id));
});
