'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const calc = require('./calc');

const DEFAULT_FILE_PATH = path.join(__dirname, '..', 'data', 'subscriptions.json');

function emptyDocument() {
  return { subscriptions: [] };
}

function isValidDocument(document) {
  return Boolean(document) && Array.isArray(document.subscriptions);
}

function isStoredRecord(item) {
  return typeof item === 'object' && item !== null && typeof item.id === 'string'
    && calc.findValidationError(item) === null;
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function parseDocument(text) {
  const parsed = tryParseJson(text);
  if (!isValidDocument(parsed)) {
    return { document: emptyDocument(), corrupt: true, missing: false };
  }
  const validRecords = parsed.subscriptions.filter(isStoredRecord);
  return {
    document: { ...parsed, subscriptions: validRecords },
    corrupt: validRecords.length !== parsed.subscriptions.length,
    missing: false,
  };
}

async function readDocument(filePath) {
  let text;
  try {
    text = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { document: emptyDocument(), corrupt: false, missing: true };
    }
    return { document: emptyDocument(), corrupt: true, missing: false };
  }
  return parseDocument(text);
}

async function writeDocument(filePath, document) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${crypto.randomUUID()}.tmp`;
  try {
    await fs.writeFile(tempPath, JSON.stringify(document, null, 2));
    await fs.rename(tempPath, filePath);
  } catch (error) {
    await fs.rm(tempPath, { force: true });
    throw error;
  }
}

async function loadDocument(filePath) {
  const result = await readDocument(filePath);
  if (result.missing) {
    await writeDocument(filePath, result.document);
  }
  return result;
}

function backupPathFor(filePath) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseName = path.basename(filePath, '.json');
  return path.join(path.dirname(filePath), `${baseName}.corrupt-${stamp}.json`);
}

async function backupCorruptFile(filePath) {
  await fs.copyFile(filePath, backupPathFor(filePath));
}

async function saveWithBackupIfCorrupt(filePath, document, corrupt) {
  if (corrupt) {
    await backupCorruptFile(filePath);
  }
  await writeDocument(filePath, document);
}

function createQueue() {
  let tail = Promise.resolve();
  return function enqueue(task) {
    const run = tail.then(task);
    tail = run.catch(() => {});
    return run;
  };
}

function createStore(filePath = DEFAULT_FILE_PATH) {
  const enqueue = createQueue();

  async function list() {
    const { document } = await loadDocument(filePath);
    return document.subscriptions;
  }

  async function add(record) {
    const { document, corrupt } = await loadDocument(filePath);
    document.subscriptions.push(record);
    await saveWithBackupIfCorrupt(filePath, document, corrupt);
    return record;
  }

  async function remove(id) {
    const { document, corrupt } = await loadDocument(filePath);
    const remaining = document.subscriptions.filter((item) => item.id !== id);
    if (remaining.length === document.subscriptions.length) {
      return false;
    }
    document.subscriptions = remaining;
    await saveWithBackupIfCorrupt(filePath, document, corrupt);
    return true;
  }

  return {
    filePath,
    list: () => enqueue(list),
    add: (record) => enqueue(() => add(record)),
    remove: (id) => enqueue(() => remove(id)),
  };
}

module.exports = { createStore, DEFAULT_FILE_PATH };
