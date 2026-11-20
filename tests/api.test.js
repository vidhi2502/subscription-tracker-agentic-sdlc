'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createApp } = require('../src/server');
const { createStore } = require('../src/store');

const FIXED_TODAY = new Date(2026, 10, 20);

function validBody(overrides = {}) {
  return {
    name: 'Netflix',
    cost: 199,
    cycle: 'monthly',
    renewalDate: '2026-12-01',
    ...overrides,
  };
}

describe('API', () => {
  let tempDir;
  let server;
  let baseUrl;
  let store;

  before(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'subtracker-api-'));
    store = createStore(path.join(tempDir, 'subscriptions.json'));
    const app = createApp({ store, today: () => FIXED_TODAY });
    server = await new Promise((resolve) => {
      const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  async function send(method, url, body, rawBody) {
    const options = { method, headers: {} };
    if (rawBody !== undefined) {
      options.headers['Content-Type'] = 'application/json';
      options.body = rawBody;
    } else if (body !== undefined) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
    const response = await fetch(`${baseUrl}${url}`, options);
    const json = await response.json().catch(() => null);
    return { status: response.status, body: json };
  }

  async function createSubscription(overrides) {
    return send('POST', '/api/subscriptions', validBody(overrides));
  }

  describe('POST /api/subscriptions', () => {
    it('returns 201 with the stored item, id and nextRenewalDate', async () => {
      const response = await createSubscription();
      assert.strictEqual(response.status, 201);
      const { subscription } = response.body;
      assert.match(subscription.id, /^[0-9a-f-]{36}$/);
      assert.strictEqual(subscription.name, 'Netflix');
      assert.strictEqual(subscription.cost, 199);
      assert.strictEqual(subscription.cycle, 'monthly');
      assert.strictEqual(subscription.renewalDate, '2026-12-01');
      assert.strictEqual(subscription.nextRenewalDate, '2026-12-01');
    });

    it('drops a notes field and does not store it', async () => {
      const response = await createSubscription({ name: 'Gym', notes: 'bring towel' });
      assert.strictEqual(response.status, 201);
      assert.strictEqual('notes' in response.body.subscription, false);
      const stored = (await store.list()).find((item) => item.name === 'Gym');
      assert.ok(stored);
      assert.strictEqual('notes' in stored, false);
    });

    it('accepts an optional category and trims it', async () => {
      const response = await createSubscription({ name: 'Cloud', category: '  Work ' });
      assert.strictEqual(response.status, 201);
      assert.strictEqual(response.body.subscription.category, 'Work');
    });

    it('returns 400 with an error for an empty name', async () => {
      const response = await createSubscription({ name: '   ' });
      assert.strictEqual(response.status, 400);
      assert.strictEqual(typeof response.body.error, 'string');
    });

    it('returns 400 for a numeric name', async () => {
      const response = await createSubscription({ name: 42 });
      assert.strictEqual(response.status, 400);
      assert.strictEqual(typeof response.body.error, 'string');
    });

    it('returns 400 for a cost of 0 or less', async () => {
      assert.strictEqual((await createSubscription({ cost: 0 })).status, 400);
      assert.strictEqual((await createSubscription({ cost: -10 })).status, 400);
    });

    it('returns 400 for a cost sent as a string', async () => {
      const response = await createSubscription({ cost: '199' });
      assert.strictEqual(response.status, 400);
      assert.strictEqual(typeof response.body.error, 'string');
    });

    it('returns 400 for a cycle other than monthly or yearly', async () => {
      const response = await createSubscription({ cycle: 'weekly' });
      assert.strictEqual(response.status, 400);
      assert.strictEqual(typeof response.body.error, 'string');
    });

    it('returns 400 for an invalid calendar date', async () => {
      const response = await createSubscription({ renewalDate: '2026-13-45' });
      assert.strictEqual(response.status, 400);
      assert.strictEqual(typeof response.body.error, 'string');
    });

    it('returns 400 for a name longer than 100 characters', async () => {
      const response = await createSubscription({ name: 'n'.repeat(101) });
      assert.strictEqual(response.status, 400);
    });

    it('returns 400 for a category longer than 50 characters', async () => {
      const response = await createSubscription({ category: 'c'.repeat(51) });
      assert.strictEqual(response.status, 400);
    });

    it('returns 400 with an error for malformed JSON', async () => {
      const response = await send('POST', '/api/subscriptions', undefined, '{"name": ');
      assert.strictEqual(response.status, 400);
      assert.strictEqual(typeof response.body.error, 'string');
    });
  });

  describe('DELETE /api/subscriptions/:id', () => {
    it('returns 200 with ok true and removes the item', async () => {
      const created = await createSubscription({ name: 'ToDelete' });
      const id = created.body.subscription.id;

      const response = await send('DELETE', `/api/subscriptions/${id}`);

      assert.strictEqual(response.status, 200);
      assert.deepStrictEqual(response.body, { ok: true });
      const remaining = await send('GET', '/api/subscriptions');
      assert.strictEqual(
        remaining.body.subscriptions.some((item) => item.id === id),
        false
      );
    });

    it('returns 404 with an error for an unknown id', async () => {
      const response = await send('DELETE', '/api/subscriptions/999');
      assert.strictEqual(response.status, 404);
      assert.strictEqual(typeof response.body.error, 'string');
    });
  });

  describe('no edit endpoint', () => {
    it('returns 404 for PUT on an item path', async () => {
      const response = await send('PUT', '/api/subscriptions/999', validBody());
      assert.strictEqual(response.status, 404);
    });

    it('returns 404 for PATCH on an item path', async () => {
      const response = await send('PATCH', '/api/subscriptions/999', { name: 'x' });
      assert.strictEqual(response.status, 404);
    });
  });

  describe('GET endpoints', () => {
    it('returns the list with nextRenewalDate for each item', async () => {
      const response = await send('GET', '/api/subscriptions');
      assert.strictEqual(response.status, 200);
      assert.ok(Array.isArray(response.body.subscriptions));
      for (const item of response.body.subscriptions) {
        assert.match(item.nextRenewalDate, /^\d{4}-\d{2}-\d{2}$/);
      }
    });

    it('returns the monthly total and renewing-soon list in the summary', async () => {
      await createSubscription({ name: 'Summary yearly', cost: 1200, cycle: 'yearly', renewalDate: '2026-11-25' });
      const response = await send('GET', '/api/summary');
      assert.strictEqual(response.status, 200);
      assert.strictEqual(typeof response.body.monthlyTotal, 'number');
      const names = response.body.renewingSoon.map((item) => item.name);
      assert.ok(names.includes('Summary yearly'));
    });
  });

  describe('unknown API paths', () => {
    it('returns a JSON 404 for an unknown API path', async () => {
      const response = await send('GET', '/api/unknown');
      assert.strictEqual(response.status, 404);
      assert.strictEqual(typeof response.body.error, 'string');
    });
  });
});

describe('API with an invalid stored record', () => {
  let tempDir;
  let server;
  let baseUrl;

  before(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'subtracker-api-bad-'));
    const filePath = path.join(tempDir, 'subscriptions.json');
    const invalidRecord = {
      id: 'bad-date',
      name: 'Broken',
      cost: 10,
      cycle: 'monthly',
      renewalDate: '2026-02-30',
    };
    fs.writeFileSync(filePath, JSON.stringify({ subscriptions: [invalidRecord] }));
    const app = createApp({ store: createStore(filePath), today: () => FIXED_TODAY });
    server = await new Promise((resolve) => {
      const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('still returns the list and summary without a server error', async () => {
    const list = await fetch(`${baseUrl}/api/subscriptions`);
    const summary = await fetch(`${baseUrl}/api/summary`);
    assert.strictEqual(list.status, 200);
    assert.strictEqual(summary.status, 200);
    assert.deepStrictEqual((await list.json()).subscriptions, []);
  });
});
