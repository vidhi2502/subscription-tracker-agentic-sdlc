'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createStore, DEFAULT_FILE_PATH } = require('../src/store');

const SUBSCRIPTION = {
  id: 'sub-1',
  name: 'Gym',
  cost: 999,
  cycle: 'monthly',
  renewalDate: '2026-12-01',
};

describe('store', () => {
  let tempDir;
  let filePath;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'subtracker-store-'));
    filePath = path.join(tempDir, 'nested', 'subscriptions.json');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function readFileJson() {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  function backupFiles() {
    return fs
      .readdirSync(path.dirname(filePath))
      .filter((name) => name.includes('.corrupt-'));
  }

  describe('missing file', () => {
    it('returns an empty list and creates the file and its directory', async () => {
      const store = createStore(filePath);
      assert.deepStrictEqual(await store.list(), []);
      assert.deepStrictEqual(readFileJson(), { subscriptions: [] });
    });
  });

  describe('corrupt or wrong-shape file', () => {
    it('returns an empty list for unparseable JSON without throwing', async () => {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, '{not json');
      const store = createStore(filePath);
      assert.deepStrictEqual(await store.list(), []);
    });

    it('returns an empty list for a document without a subscriptions array', async () => {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify({ subscriptions: 'oops' }));
      const store = createStore(filePath);
      assert.deepStrictEqual(await store.list(), []);
    });

    it('returns an empty list for a top-level array', async () => {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify([SUBSCRIPTION]));
      const store = createStore(filePath);
      assert.deepStrictEqual(await store.list(), []);
    });

    it('copies a corrupt file to a timestamped backup before the next write', async () => {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, '{not json');
      const store = createStore(filePath);

      await store.add(SUBSCRIPTION);

      const backups = backupFiles();
      assert.strictEqual(backups.length, 1);
      assert.match(backups[0], /^subscriptions\.corrupt-.+\.json$/);
      const backupText = fs.readFileSync(path.join(path.dirname(filePath), backups[0]), 'utf8');
      assert.strictEqual(backupText, '{not json');
      assert.deepStrictEqual(readFileJson(), { subscriptions: [SUBSCRIPTION] });
    });

    it('backs up a wrong-shape file before the next write', async () => {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify({ other: true }));
      const store = createStore(filePath);

      await store.add(SUBSCRIPTION);

      assert.strictEqual(backupFiles().length, 1);
      assert.deepStrictEqual(readFileJson(), { subscriptions: [SUBSCRIPTION] });
    });
  });

  describe('add, list and remove', () => {
    it('adds a record and lists it', async () => {
      const store = createStore(filePath);
      const returned = await store.add(SUBSCRIPTION);
      assert.deepStrictEqual(returned, SUBSCRIPTION);
      assert.deepStrictEqual(await store.list(), [SUBSCRIPTION]);
    });

    it('removes a record by id and returns true', async () => {
      const store = createStore(filePath);
      await store.add(SUBSCRIPTION);
      assert.strictEqual(await store.remove('sub-1'), true);
      assert.deepStrictEqual(await store.list(), []);
    });

    it('returns false and leaves data unchanged when the id is unknown', async () => {
      const store = createStore(filePath);
      await store.add(SUBSCRIPTION);
      assert.strictEqual(await store.remove('missing'), false);
      assert.deepStrictEqual(await store.list(), [SUBSCRIPTION]);
    });

    it('does not leave temporary files behind after a write', async () => {
      const store = createStore(filePath);
      await store.add(SUBSCRIPTION);
      assert.deepStrictEqual(fs.readdirSync(path.dirname(filePath)), ['subscriptions.json']);
    });
  });

  describe('serialized mutations', () => {
    it('keeps every concurrent add when they are issued together', async () => {
      const store = createStore(filePath);
      const records = Array.from({ length: 20 }, (_, index) => ({
        ...SUBSCRIPTION,
        id: `sub-${index}`,
      }));

      await Promise.all(records.map((record) => store.add(record)));

      const listed = await store.list();
      assert.strictEqual(listed.length, 20);
      assert.deepStrictEqual(
        listed.map((item) => item.id).sort(),
        records.map((item) => item.id).sort()
      );
    });
  });

  describe('default location', () => {
    it('points at data/subscriptions.json under the project root', () => {
      assert.strictEqual(path.basename(DEFAULT_FILE_PATH), 'subscriptions.json');
      assert.strictEqual(path.basename(path.dirname(DEFAULT_FILE_PATH)), 'data');
    });
  });
});
