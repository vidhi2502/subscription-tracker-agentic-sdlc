'use strict';

const crypto = require('node:crypto');
const path = require('node:path');
const express = require('express');
const calc = require('./calc');
const { createStore } = require('./store');

const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT) || 3000;
const BODY_LIMIT = '10kb';
const PUBLIC_DIR = path.join(__dirname, 'public');

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve()
      .then(() => handler(req, res))
      .catch(next);
  };
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'request body must be valid JSON' });
  }
  if (error.status === 413) {
    return res.status(413).json({ error: 'request body is too large' });
  }
  console.error(`request failed: ${error.message}`);
  return res.status(500).json({ error: 'internal server error' });
}

function registerSubscriptionRoutes(app, store, today) {
  app.get(
    '/api/subscriptions',
    asyncRoute(async (req, res) => {
      const items = await store.list();
      res.json({ subscriptions: calc.withNextRenewal(items, today()) });
    })
  );

  app.post(
    '/api/subscriptions',
    asyncRoute(async (req, res) => {
      const error = calc.findValidationError(req.body);
      if (error) {
        return res.status(400).json({ error });
      }
      const record = { id: crypto.randomUUID(), ...calc.toRecord(req.body) };
      await store.add(record);
      const [subscription] = calc.withNextRenewal([record], today());
      return res.status(201).json({ subscription });
    })
  );

  app.delete(
    '/api/subscriptions/:id',
    asyncRoute(async (req, res) => {
      const removed = await store.remove(req.params.id);
      if (!removed) {
        return res.status(404).json({ error: 'subscription not found' });
      }
      return res.json({ ok: true });
    })
  );
}

function registerSummaryRoute(app, store, today) {
  app.get(
    '/api/summary',
    asyncRoute(async (req, res) => {
      const items = await store.list();
      res.json({
        monthlyTotal: calc.monthlyTotal(items),
        renewingSoon: calc.renewingWithin(items, today()),
      });
    })
  );
}

function createApp(options = {}) {
  const store = options.store || createStore();
  const today = options.today || (() => new Date());
  const app = express();

  app.use(express.json({ limit: BODY_LIMIT }));
  app.use(express.static(PUBLIC_DIR));
  registerSubscriptionRoutes(app, store, today);
  registerSummaryRoute(app, store, today);
  app.use('/api', (req, res) => res.status(404).json({ error: 'not found' }));
  app.use(errorHandler);

  return app;
}

if (require.main === module) {
  createApp().listen(PORT, HOST, () => {
    console.log(`Subscription tracker running at http://${HOST}:${PORT}`);
  });
}

module.exports = { createApp };
